package utils

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 14

func GeneratePasswordHash(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", fmt.Errorf("failed to generate password hash: %w", err)
	}
	return string(hash), nil
}
func VerifyPassword(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
