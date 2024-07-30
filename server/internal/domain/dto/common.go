package dto

// AuthResponse represents the structure of the authentication response
type AuthResponse struct {
	AccessToken string `json:"access_token"`
}

// ErrorResponse represents the structure of an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// MessageResponse represents a simple message response
type MessageResponse struct {
	Message string `json:"message"`
}
