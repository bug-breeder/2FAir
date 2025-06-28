package interfaces

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
