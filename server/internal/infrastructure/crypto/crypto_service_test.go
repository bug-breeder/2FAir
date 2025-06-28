package crypto

import (
	"bytes"
	"testing"
)

func TestCryptoService_Encrypt_Decrypt(t *testing.T) {
	crypto := NewCryptoService()

	// Test data
	originalData := []byte("Hello, World! This is a test message for encryption.")
	key := make([]byte, 32) // AES-256 key
	for i := range key {
		key[i] = byte(i)
	}

	// Test encryption
	ciphertext, nonce, err := crypto.Encrypt(originalData, key)
	if err != nil {
		t.Fatalf("Encryption failed: %v", err)
	}

	// Verify we got data back
	if len(ciphertext) == 0 {
		t.Error("Ciphertext is empty")
	}
	if len(nonce) == 0 {
		t.Error("Nonce is empty")
	}

	// Verify ciphertext is different from original
	if bytes.Equal(ciphertext[:len(originalData)], originalData) {
		t.Error("Ciphertext should not match original data")
	}

	// Test decryption
	decryptedData, err := crypto.Decrypt(ciphertext, nonce, key)
	if err != nil {
		t.Fatalf("Decryption failed: %v", err)
	}

	// Verify decrypted data matches original
	if !bytes.Equal(decryptedData, originalData) {
		t.Errorf("Decrypted data doesn't match original.\nOriginal: %s\nDecrypted: %s", originalData, decryptedData)
	}
}

func TestCryptoService_InvalidKey(t *testing.T) {
	crypto := NewCryptoService()
	data := []byte("test data")

	// Test with invalid key size (not 32 bytes)
	invalidKey := []byte("short")
	_, _, err := crypto.Encrypt(data, invalidKey)
	if err == nil {
		t.Error("Expected error with invalid key size")
	}

	// Test decryption with invalid key size
	_, err = crypto.Decrypt([]byte("dummy"), []byte("dummy"), invalidKey)
	if err == nil {
		t.Error("Expected error with invalid key size for decryption")
	}
}

func TestCryptoService_GenerateRandomKey(t *testing.T) {
	crypto := NewCryptoService()

	key1, err := crypto.GenerateRandomKey()
	if err != nil {
		t.Fatalf("Failed to generate random key: %v", err)
	}

	key2, err := crypto.GenerateRandomKey()
	if err != nil {
		t.Fatalf("Failed to generate second random key: %v", err)
	}

	// Verify key length
	if len(key1) != 32 {
		t.Errorf("Expected key length 32, got %d", len(key1))
	}

	// Verify keys are different (extremely unlikely to be the same)
	if bytes.Equal(key1, key2) {
		t.Error("Generated keys should be different")
	}
}

func TestCryptoService_GenerateRandomSalt(t *testing.T) {
	crypto := NewCryptoService()

	salt1, err := crypto.GenerateRandomSalt()
	if err != nil {
		t.Fatalf("Failed to generate random salt: %v", err)
	}

	salt2, err := crypto.GenerateRandomSalt()
	if err != nil {
		t.Fatalf("Failed to generate second random salt: %v", err)
	}

	// Verify salt length
	if len(salt1) != 16 {
		t.Errorf("Expected salt length 16, got %d", len(salt1))
	}

	// Verify salts are different
	if bytes.Equal(salt1, salt2) {
		t.Error("Generated salts should be different")
	}
}

func TestCryptoService_DeriveKey(t *testing.T) {
	crypto := NewCryptoService()

	password := []byte("test-password")
	salt := []byte("test-salt-16byte")
	iterations := 10000

	key1 := crypto.DeriveKey(password, salt, iterations)
	key2 := crypto.DeriveKey(password, salt, iterations)

	// Verify key length
	if len(key1) != 32 {
		t.Errorf("Expected derived key length 32, got %d", len(key1))
	}

	// Verify deterministic derivation (same inputs = same key)
	if !bytes.Equal(key1, key2) {
		t.Error("Key derivation should be deterministic")
	}

	// Verify different salt produces different key
	differentSalt := []byte("different-salt16")
	key3 := crypto.DeriveKey(password, differentSalt, iterations)
	if bytes.Equal(key1, key3) {
		t.Error("Different salt should produce different key")
	}
}

func TestCryptoService_TamperedData(t *testing.T) {
	crypto := NewCryptoService()

	originalData := []byte("Sensitive data that should not be tampered with")
	key := make([]byte, 32)
	for i := range key {
		key[i] = byte(i)
	}

	// Encrypt data
	ciphertext, nonce, err := crypto.Encrypt(originalData, key)
	if err != nil {
		t.Fatalf("Encryption failed: %v", err)
	}

	// Tamper with ciphertext
	tamperedCiphertext := make([]byte, len(ciphertext))
	copy(tamperedCiphertext, ciphertext)
	tamperedCiphertext[0] ^= 0x01 // Flip one bit

	// Try to decrypt tampered data - should fail
	_, err = crypto.Decrypt(tamperedCiphertext, nonce, key)
	if err == nil {
		t.Error("Expected decryption to fail with tampered ciphertext")
	}

	// Tamper with nonce
	tamperedNonce := make([]byte, len(nonce))
	copy(tamperedNonce, nonce)
	tamperedNonce[0] ^= 0x01 // Flip one bit

	// Try to decrypt with tampered nonce - should fail
	_, err = crypto.Decrypt(ciphertext, tamperedNonce, key)
	if err == nil {
		t.Error("Expected decryption to fail with tampered nonce")
	}
}
