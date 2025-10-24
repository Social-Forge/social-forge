package middlewares

var (
	ErrNotFoundCsrfToken    = "Unauthorized - CSRF token not found"
	ErrMismatchCsrfToken    = "Unauthorized - CSRF mismatch"
	ErrExpiredCsrfToken     = "Unauthorized - Invalid or expired csrf token"
	ErrInvalidCsrfAuth      = "Unauthorized - Invalid authorization header"
	ErrInvalidOriginRequest = "Forbidden - Invalid request origin"
)
