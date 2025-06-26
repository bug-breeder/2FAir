package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/repositories"
	"github.com/bug-breeder/2fair/server/internal/domain/services"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
)

type webAuthnService struct {
	webAuthn *webauthn.WebAuthn
	credRepo repositories.WebAuthnCredentialRepository
	userRepo repositories.UserRepository
}

// NewWebAuthnService creates a new WebAuthn service
func NewWebAuthnService(
	rpID string,
	rpName string,
	rpOrigins []string,
	credRepo repositories.WebAuthnCredentialRepository,
	userRepo repositories.UserRepository,
) (services.WebAuthnService, error) {
	// Validate required parameters
	if rpID == "" {
		return nil, fmt.Errorf("RPID is required")
	}
	if rpName == "" {
		return nil, fmt.Errorf("RP display name is required")
	}
	if len(rpOrigins) == 0 {
		return nil, fmt.Errorf("at least one RP origin is required")
	}

	config := &webauthn.Config{
		RPDisplayName: rpName,
		RPID:          rpID,
		RPOrigins:     rpOrigins,
		Debug:         false,
	}

	webAuthn, err := webauthn.New(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create WebAuthn instance: %w", err)
	}

	return &webAuthnService{
		webAuthn: webAuthn,
		credRepo: credRepo,
		userRepo: userRepo,
	}, nil
}

// webAuthnUser implements webauthn.User interface
type webAuthnUser struct {
	user        *entities.User
	credentials []*entities.WebAuthnCredential
}

func (u *webAuthnUser) WebAuthnID() []byte {
	return []byte(u.user.ID.String())
}

func (u *webAuthnUser) WebAuthnName() string {
	return u.user.Email
}

func (u *webAuthnUser) WebAuthnDisplayName() string {
	return u.user.DisplayName
}

func (u *webAuthnUser) WebAuthnCredentials() []webauthn.Credential {
	credentials := make([]webauthn.Credential, len(u.credentials))
	for i, cred := range u.credentials {
		// Convert transport strings to AuthenticatorTransport
		transports := make([]protocol.AuthenticatorTransport, len(cred.Transport))
		for j, t := range cred.Transport {
			transports[j] = protocol.AuthenticatorTransport(t)
		}

		// Convert AAGUID from *uuid.UUID to []byte
		var aaguid []byte
		if cred.AAGUID != nil {
			aaguidBytes, _ := cred.AAGUID.MarshalBinary()
			aaguid = aaguidBytes
		}

		credentials[i] = webauthn.Credential{
			ID:              cred.CredentialID,
			PublicKey:       cred.PublicKey,
			AttestationType: "none", // Default attestation type
			Transport:       transports,
			Flags: webauthn.CredentialFlags{
				UserPresent:    true, // Default to true
				UserVerified:   true, // Default to true
				BackupEligible: cred.BackupEligible,
				BackupState:    cred.BackupState,
			},
			Authenticator: webauthn.Authenticator{
				AAGUID:    aaguid,
				SignCount: uint32(cred.SignCount),
			},
		}
	}
	return credentials
}

func (u *webAuthnUser) WebAuthnIcon() string {
	return ""
}

// BeginRegistration starts WebAuthn credential registration
func (w *webAuthnService) BeginRegistration(ctx context.Context, user *entities.User, authenticatorSelection *protocol.AuthenticatorSelection) (*services.WebAuthnCredentialCreation, error) {
	// Get existing credentials for the user
	existingCreds, err := w.credRepo.GetByUserID(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing credentials: %w", err)
	}

	webAuthnUser := &webAuthnUser{
		user:        user,
		credentials: existingCreds,
	}

	// Create registration options with PRF extension
	registerOptions := func(credCreationOpts *protocol.PublicKeyCredentialCreationOptions) {
		if authenticatorSelection != nil {
			credCreationOpts.AuthenticatorSelection = *authenticatorSelection
		}

		// Enable PRF extension for vault key derivation
		credCreationOpts.Extensions = protocol.AuthenticationExtensions{
			"prf": map[string]interface{}{},
		}
	}

	credentialCreation, sessionData, err := w.webAuthn.BeginRegistration(webAuthnUser, registerOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to begin registration: %w", err)
	}

	return &services.WebAuthnCredentialCreation{
		PublicKeyCredentialCreationOptions: credentialCreation,
		SessionData:                        sessionData,
	}, nil
}

// FinishRegistration completes WebAuthn credential registration
func (w *webAuthnService) FinishRegistration(ctx context.Context, user *entities.User, sessionData *webauthn.SessionData, request *http.Request) (*entities.WebAuthnCredential, error) {
	// Get existing credentials for the user
	existingCreds, err := w.credRepo.GetByUserID(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing credentials: %w", err)
	}

	webAuthnUser := &webAuthnUser{
		user:        user,
		credentials: existingCreds,
	}

	credential, err := w.webAuthn.FinishRegistration(webAuthnUser, *sessionData, request)
	if err != nil {
		return nil, fmt.Errorf("failed to finish registration: %w", err)
	}

	// Convert AAGUID from []byte to *uuid.UUID
	var aaguid *uuid.UUID
	if len(credential.Authenticator.AAGUID) > 0 {
		if parsed, err := uuid.FromBytes(credential.Authenticator.AAGUID); err == nil {
			aaguid = &parsed
		}
	}

	// Convert transport types
	var transports []string
	for _, transport := range credential.Transport {
		transports = append(transports, string(transport))
	}
	// Ensure we always have a non-empty slice to avoid database NULL constraint violation
	if len(transports) == 0 {
		transports = []string{"internal"} // Default transport type
	}

	// Create credential entity with actual WebAuthn values
	credEntity := &entities.WebAuthnCredential{
		ID:             uuid.New(),
		UserID:         user.ID,
		CredentialID:   credential.ID,
		PublicKey:      credential.PublicKey,
		AAGUID:         aaguid,
		CloneWarning:   false, // Initially false
		Attachment:     "",    // Will be set via SetAttachment if needed
		Transport:      transports,
		BackupEligible: credential.Flags.BackupEligible,
		BackupState:    credential.Flags.BackupState,
		SignCount:      uint64(credential.Authenticator.SignCount),
		CreatedAt:      time.Now(),
		LastUsedAt:     nil, // Will be set on first use
	}

	// Validate and create credential
	if err := credEntity.Validate(); err != nil {
		return nil, fmt.Errorf("invalid credential: %w", err)
	}

	if err := w.credRepo.Create(ctx, credEntity); err != nil {
		return nil, fmt.Errorf("failed to store credential: %w", err)
	}

	return credEntity, nil
}

// ClientExtensionResults represents the client extension results from WebAuthn response
type ClientExtensionResults struct {
	PRF *PRFExtensionResults `json:"prf,omitempty"`
}

// PRFExtensionResults represents the PRF extension results
type PRFExtensionResults struct {
	Results *PRFResults `json:"results,omitempty"`
}

// PRFResults represents the PRF results
type PRFResults struct {
	First  string `json:"first,omitempty"`  // Base64url encoded PRF output
	Second string `json:"second,omitempty"` // Base64url encoded PRF output (optional)
}

// WebAuthnAssertionRequest represents the WebAuthn assertion request from client
type WebAuthnAssertionRequest struct {
	ID       string `json:"id"`
	RawID    string `json:"rawId"`
	Response struct {
		AuthenticatorData string `json:"authenticatorData"`
		ClientDataJSON    string `json:"clientDataJSON"`
		Signature         string `json:"signature"`
		UserHandle        string `json:"userHandle,omitempty"`
	} `json:"response"`
	Type                      string                  `json:"type"`
	ClientExtensionResults    *ClientExtensionResults `json:"clientExtensionResults,omitempty"`
	GetClientExtensionResults *ClientExtensionResults `json:"getClientExtensionResults,omitempty"`
}

// BeginAssertion starts WebAuthn credential assertion
func (w *webAuthnService) BeginAssertion(ctx context.Context, user *entities.User, allowedCredentials []protocol.CredentialDescriptor) (*services.WebAuthnCredentialAssertion, error) {
	// Get existing credentials for the user
	existingCreds, err := w.credRepo.GetByUserID(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing credentials: %w", err)
	}

	if len(existingCreds) == 0 {
		return nil, fmt.Errorf("no credentials found for user")
	}

	webAuthnUser := &webAuthnUser{
		user:        user,
		credentials: existingCreds,
	}

	// Create assertion options with PRF extension for key derivation
	assertionOptions := func(credAssertionOpts *protocol.PublicKeyCredentialRequestOptions) {
		if len(allowedCredentials) > 0 {
			credAssertionOpts.AllowedCredentials = allowedCredentials
		}

		// Enable PRF extension for vault key derivation
		credAssertionOpts.Extensions = protocol.AuthenticationExtensions{
			"prf": map[string]interface{}{
				"eval": map[string]interface{}{
					"first": "MkZBaXJWYXVsdEtleURlcml2YXRpb24=", // Base64url: "2FairVaultKeyDerivation"
				},
			},
		}
	}

	credentialAssertion, sessionData, err := w.webAuthn.BeginLogin(webAuthnUser, assertionOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to begin assertion: %w", err)
	}

	return &services.WebAuthnCredentialAssertion{
		PublicKeyCredentialRequestOptions: credentialAssertion,
		SessionData:                       sessionData,
	}, nil
}

// FinishAssertion completes WebAuthn credential assertion
func (w *webAuthnService) FinishAssertion(ctx context.Context, user *entities.User, sessionData *webauthn.SessionData, request *http.Request) (*entities.WebAuthnCredential, []byte, error) {
	// Get existing credentials for the user
	existingCreds, err := w.credRepo.GetByUserID(ctx, user.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get existing credentials: %w", err)
	}

	webAuthnUser := &webAuthnUser{
		user:        user,
		credentials: existingCreds,
	}

	// Parse the request body to extract PRF extension results before WebAuthn processing
	var prfOutput []byte
	if request.Body != nil {
		// Read the request body
		bodyBytes, err := io.ReadAll(request.Body)
		if err == nil {
			// Parse the WebAuthn assertion request
			var assertionReq WebAuthnAssertionRequest
			if err := json.Unmarshal(bodyBytes, &assertionReq); err == nil {
				// Extract PRF output from client extension results
				prfOutput = w.extractPRFOutput(&assertionReq)
			}
		}
		// Create a new reader for the WebAuthn library to use
		request.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	}

	credential, err := w.webAuthn.FinishLogin(webAuthnUser, *sessionData, request)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to finish assertion: %w", err)
	}

	// Find the credential entity
	var credEntity *entities.WebAuthnCredential
	for _, cred := range existingCreds {
		if string(cred.CredentialID) == string(credential.ID) {
			credEntity = cred
			break
		}
	}

	if credEntity == nil {
		return nil, nil, fmt.Errorf("credential not found")
	}

	// Update sign count using entity method (includes clone detection)
	credEntity.UpdateSignCount(uint64(credential.Authenticator.SignCount))

	if err := w.credRepo.Update(ctx, credEntity); err != nil {
		return nil, nil, fmt.Errorf("failed to update credential: %w", err)
	}

	return credEntity, prfOutput, nil
}

// extractPRFOutput extracts PRF output from WebAuthn assertion request
func (w *webAuthnService) extractPRFOutput(req *WebAuthnAssertionRequest) []byte {
	// Try to get PRF results from different possible locations
	var prfResults *PRFResults

	// Check clientExtensionResults field
	if req.ClientExtensionResults != nil && req.ClientExtensionResults.PRF != nil {
		prfResults = req.ClientExtensionResults.PRF.Results
	}

	// Check getClientExtensionResults field (alternative naming)
	if prfResults == nil && req.GetClientExtensionResults != nil && req.GetClientExtensionResults.PRF != nil {
		prfResults = req.GetClientExtensionResults.PRF.Results
	}

	// Extract the first PRF result (main key derivation output)
	if prfResults != nil && prfResults.First != "" {
		// Decode base64url encoded PRF output
		if prfData, err := base64.RawURLEncoding.DecodeString(prfResults.First); err == nil {
			return prfData
		}
		// Try standard base64 if base64url fails
		if prfData, err := base64.StdEncoding.DecodeString(prfResults.First); err == nil {
			return prfData
		}
	}

	return nil
}

// DeriveVaultKey derives a vault encryption key using PRF
func (w *webAuthnService) DeriveVaultKey(ctx context.Context, user *entities.User, credentialID []byte, prfInput []byte) ([]byte, error) {
	// This is a simplified implementation
	// In practice, you would trigger a WebAuthn assertion with PRF extension
	// and return the derived key from the authenticator
	return nil, fmt.Errorf("DeriveVaultKey should be called through the assertion flow")
}

// GetUserCredentials retrieves all WebAuthn credentials for a user
func (w *webAuthnService) GetUserCredentials(ctx context.Context, userID string) ([]*entities.WebAuthnCredential, error) {
	// Convert string userID to UUID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	credentials, err := w.credRepo.GetByUserID(ctx, userUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get WebAuthn credentials: %w", err)
	}

	return credentials, nil
}

// DeleteCredential deletes a WebAuthn credential
func (w *webAuthnService) DeleteCredential(ctx context.Context, userID string, credentialID []byte) error {
	// Convert string userID to UUID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID format: %w", err)
	}

	if err := w.credRepo.Delete(ctx, credentialID, userUUID); err != nil {
		return fmt.Errorf("failed to delete WebAuthn credential: %w", err)
	}

	return nil
}
