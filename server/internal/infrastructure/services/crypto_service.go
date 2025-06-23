package services

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"

	"golang.org/x/crypto/pbkdf2"
)

// CryptoService handles encryption and decryption operations
type CryptoService interface {
	// Encrypt encrypts data using AES-256-GCM
	Encrypt(data []byte, key []byte) ([]byte, []byte, error) // returns (ciphertext, nonce, error)

	// Decrypt decrypts data using AES-256-GCM
	Decrypt(ciphertext []byte, nonce []byte, key []byte) ([]byte, error)

	// DeriveKey derives a key from password and salt using PBKDF2
	DeriveKey(password []byte, salt []byte, iterations int) []byte

	// GenerateRandomKey generates a random 32-byte key
	GenerateRandomKey() ([]byte, error)

	// GenerateRandomSalt generates a random 16-byte salt
	GenerateRandomSalt() ([]byte, error)
}

type cryptoService struct{}

// NewCryptoService creates a new crypto service
func NewCryptoService() CryptoService {
	return &cryptoService{}
}

// Encrypt encrypts data using AES-256-GCM
func (c *cryptoService) Encrypt(data []byte, key []byte) ([]byte, []byte, error) {
	// Ensure key is 32 bytes for AES-256
	if len(key) != 32 {
		return nil, nil, fmt.Errorf("key must be 32 bytes for AES-256")
	}

	// Create AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	// Generate random nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Encrypt data
	ciphertext := gcm.Seal(nil, nonce, data, nil)

	return ciphertext, nonce, nil
}

// Decrypt decrypts data using AES-256-GCM
func (c *cryptoService) Decrypt(ciphertext []byte, nonce []byte, key []byte) ([]byte, error) {
	// Ensure key is 32 bytes for AES-256
	if len(key) != 32 {
		return nil, fmt.Errorf("key must be 32 bytes for AES-256")
	}

	// Create AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	// Decrypt data
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt: %w", err)
	}

	return plaintext, nil
}

// DeriveKey derives a key from password and salt using PBKDF2
func (c *cryptoService) DeriveKey(password []byte, salt []byte, iterations int) []byte {
	return pbkdf2.Key(password, salt, iterations, 32, sha256.New)
}

// GenerateRandomKey generates a random 32-byte key
func (c *cryptoService) GenerateRandomKey() ([]byte, error) {
	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return nil, fmt.Errorf("failed to generate random key: %w", err)
	}
	return key, nil
}

// GenerateRandomSalt generates a random 16-byte salt
func (c *cryptoService) GenerateRandomSalt() ([]byte, error) {
	salt := make([]byte, 16)
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return nil, fmt.Errorf("failed to generate random salt: %w", err)
	}
	return salt, nil
}

// EncryptedData represents encrypted data with metadata
type EncryptedData struct {
	Ciphertext []byte `json:"ciphertext"`
	Nonce      []byte `json:"nonce"`
	Salt       []byte `json:"salt"`
	KeyVersion int    `json:"key_version"`
}

// EncryptJSON encrypts a JSON-serializable object
func (c *cryptoService) EncryptJSON(data interface{}, key []byte) (*EncryptedData, error) {
	// Marshal to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal data: %w", err)
	}

	// Encrypt
	ciphertext, nonce, err := c.Encrypt(jsonData, key)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt data: %w", err)
	}

	return &EncryptedData{
		Ciphertext: ciphertext,
		Nonce:      nonce,
	}, nil
}

// DecryptJSON decrypts and unmarshals a JSON object
func (c *cryptoService) DecryptJSON(encData *EncryptedData, key []byte, result interface{}) error {
	// Decrypt
	jsonData, err := c.Decrypt(encData.Ciphertext, encData.Nonce, key)
	if err != nil {
		return fmt.Errorf("failed to decrypt data: %w", err)
	}

	// Unmarshal JSON
	if err := json.Unmarshal(jsonData, result); err != nil {
		return fmt.Errorf("failed to unmarshal data: %w", err)
	}

	return nil
}
