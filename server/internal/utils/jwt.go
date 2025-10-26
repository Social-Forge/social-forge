package utils

import (
	"fmt"
	"social-forge/internal/dto"
	"social-forge/internal/entity"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func GenerateJWT(jwtSecret string, tokenMetaData *entity.TokenMetadata, expiry time.Duration) (string, error) {
	now := time.Now().UTC()
	if tokenMetaData == nil {
		return "", fmt.Errorf("token metadata cannot be nil")
	}
	if tokenMetaData.UserID == uuid.Nil {
		return "", fmt.Errorf("user ID cannot be empty")
	}
	claims := dto.JWTClaims{
		UserID:             tokenMetaData.UserID.String(),
		Email:              tokenMetaData.Email,
		RoleID:             tokenMetaData.Role.ID.String(),
		RoleName:           tokenMetaData.RoleName,
		Permissions:        tokenMetaData.PermissionName,
		PermissionResource: tokenMetaData.PermissionResource,
		PermissionAction:   tokenMetaData.PermissionAction,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "social-forge",
			Subject:   tokenMetaData.UserID.String(),
			ID:        uuid.New().String(), // Add JWT ID untuk security
		},
	}

	if tokenMetaData.TenantID != nil {
		claims.TenantID = tokenMetaData.TenantID.String()
	}
	if tokenMetaData.UserTenantID != nil {
		claims.UserTenantID = tokenMetaData.UserTenantID.String()
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}
func VerifyJWT(tokenString string, jwtSecret string) (*jwt.Token, error) {
	if tokenString == "" {
		return nil, fmt.Errorf("token string cannot be empty")
	}

	parsedToken, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validasi signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to verify jwt token: %w", err)
	}

	if !parsedToken.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return parsedToken, nil
}
func GenerateCSRFToken(userId, email string, jwtSecret string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userId,
		"email":   email,
		"exp":     time.Now().Add(time.Second * 60).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(jwtSecret))
}
func VerifyCSRFToken(tokenString string, jwtSecret string) (*jwt.Token, error) {

	csrfToken, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected request method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	return csrfToken, nil
}
