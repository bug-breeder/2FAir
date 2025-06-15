package services

import (
	"context"
	"fmt"
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

	// Create registration options
	registerOptions := func(credCreationOpts *protocol.PublicKeyCredentialCreationOptions) {
		if authenticatorSelection != nil {
			credCreationOpts.AuthenticatorSelection = *authenticatorSelection
		}

		// Enable PRF extension for key derivation
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

	// Create credential entity with correct field mapping
	credEntity := &entities.WebAuthnCredential{
		ID:             uuid.New(),
		UserID:         user.ID,
		CredentialID:   credential.ID,
		PublicKey:      credential.PublicKey,
		AAGUID:         aaguid,
		CloneWarning:   false,
		Attachment:     "", // Will be set via SetAttachment if needed
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

	// Create assertion options with PRF extension
	assertionOptions := func(credAssertionOpts *protocol.PublicKeyCredentialRequestOptions) {
		if len(allowedCredentials) > 0 {
			credAssertionOpts.AllowedCredentials = allowedCredentials
		}

		// Enable PRF extension for key derivation
		credAssertionOpts.Extensions = protocol.AuthenticationExtensions{
			"prf": map[string]interface{}{
				"eval": map[string]interface{}{
					"first": "dGVzdC1wcmYtaW5wdXQ=", // Base64 encoded PRF input
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

	// Update sign count using entity method
	credEntity.UpdateSignCount(uint64(credential.Authenticator.SignCount))

	if err := w.credRepo.Update(ctx, credEntity); err != nil {
		return nil, nil, fmt.Errorf("failed to update credential: %w", err)
	}

	// For PRF extension support, the output would be available in the credential response
	// This is a simplified implementation - actual PRF output extraction would require
	// parsing the credential response for PRF extension data
	var prfOutput []byte
	// TODO: Extract PRF output from credential response when PRF extension is used

	return credEntity, prfOutput, nil
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
