package utils

import (
	"fmt"
	"social-forge/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func GenerateJWT(userId uuid.UUID, email, role string, cfg *config.JWTConfig) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userId.String(),
		"email":   email,
		"role":    role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(cfg.Secret))
}
func VerifyJwt(tokenString string, cfg *config.JWTConfig) (*jwt.Token, error) {
	parsedToken, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(cfg.Secret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to verify jwt token %w", err)
	}

	return parsedToken, nil
}
func GenerateCSRFToken(userId, email string, cfg *config.JWTConfig) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userId,
		"email":   email,
		"exp":     time.Now().Add(time.Second * 60).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(cfg.Secret))
}
func VerifyCSRFToken(tokenString string, cfg *config.JWTConfig) (*jwt.Token, error) {
	secretKey := []byte(cfg.Secret)

	csrfToken, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected request method: %v", token.Header["alg"])
		}
		return secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	return csrfToken, nil
}
