package helpers

import (
	"errors"
	"strings"
)

type NoRetryError struct {
	error
}
type ValidationErrors struct {
	Errors map[string]string
}

func (e NoRetryError) Error() string {
	return e.error.Error()
}
func (e NoRetryError) Unwrap() error {
	return e.error
}
func NewNoRetryError(msg string) error {
	return NoRetryError{error: errors.New(msg)}
}
func (v ValidationErrors) Error() string {
	var sb strings.Builder
	i := 0
	for field, errMsg := range v.Errors {
		if i > 0 {
			sb.WriteString("; ")
		}
		sb.WriteString(field + ": " + errMsg)
		i++
	}
	return sb.String()
}
