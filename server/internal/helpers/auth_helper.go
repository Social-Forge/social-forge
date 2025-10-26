package helpers

import (
	"fmt"
	"net/smtp"
	"social-forge/config"
	"strconv"
)

type AuthHelper struct {
	userHelper  *UserHelper
	tokenHelper *TokenHelper
	mailConfig  *config.EmailConfig
}

type TypeVerify string

var (
	ResetPassword     TypeVerify = "reset_password"
	EmailVerification TypeVerify = "email_verification"
	RegistrationInfo  TypeVerify = "registration_info"
)

func NewAuthHelper(userHelper *UserHelper, tokenHelper *TokenHelper, mailConfig *config.EmailConfig) *AuthHelper {
	return &AuthHelper{
		userHelper:  userHelper,
		tokenHelper: tokenHelper,
		mailConfig:  mailConfig,
	}
}
func (h *AuthHelper) SendEmail(typeVerify TypeVerify, to, token, origin string) error {
	switch typeVerify {
	case ResetPassword:
		return h.SendResetPasswordEmail(to, token, origin)
	case EmailVerification:
		return h.SendVerificationEmail(to, token, origin)
	default:
		return fmt.Errorf("unknown email type: %s", typeVerify)
	}
}
func (h *AuthHelper) SendVerificationEmail(to, token, origin string) error {
	url := fmt.Sprintf("https://%s/auth/verify-email?token=%s", origin, token)

	subject := "Verify Your Email"
	body := fmt.Sprintf("Click the link to verify your email:\n\n%s", url)

	return h.sendEmail(to, subject, body)
}
func (h *AuthHelper) SendResetPasswordEmail(to, token, origin string) error {
	url := fmt.Sprintf("https://%s/auth/reset?token=%s", origin, token)

	subject := "Reset Password Link"
	body := fmt.Sprintf("Click the link to reset password:\n\n%s", url)

	return h.sendEmail(to, subject, body)
}
func (h *AuthHelper) SendRegistrationInfo(email, password string) error {
	subject := "AGC Account information"
	body := fmt.Sprintf("Welcome to Agc Forge.\n\nHere is your account information with temporary password:\n\nEmail: \n\n%sTemp Password: \n\n%s", email, password)

	return h.sendEmail(email, subject, body)
}
func (h *AuthHelper) sendEmail(to, subject, body string) error {
	message := []byte("Subject: " + subject + "\r\n" +
		"To: " + to + "\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
		body + "\r\n")

	auth := smtp.PlainAuth(
		"",
		h.mailConfig.SMTPUsername,
		h.mailConfig.SMTPPassword,
		h.mailConfig.SMTPHost,
	)

	addr := fmt.Sprintf("%s:%s", h.mailConfig.SMTPHost, h.mailConfig.SMTPPort)
	err := smtp.SendMail(addr, auth, h.mailConfig.SMTPUsername, []string{to}, message)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (h *AuthHelper) ValidateSMTPConfig() error {
	if h.mailConfig == nil {
		return fmt.Errorf("SMTP configuration is nil")
	}

	requiredFields := []struct {
		value *string
		field string
	}{
		{&h.mailConfig.SMTPHost, "SMTP host"},
		{&h.mailConfig.SMTPUsername, "SMTP username"},
		{&h.mailConfig.SMTPPassword, "SMTP password"},
		{&h.mailConfig.SMTPPort, "SMTP port"},
	}

	for _, field := range requiredFields {
		if field.value == nil || *field.value == "" {
			return fmt.Errorf("%s is not configured", field.field)
		}
	}

	if _, err := strconv.Atoi(h.mailConfig.SMTPPort); err != nil {
		return fmt.Errorf("invalid SMTP port format: %v", err)
	}

	return nil
}
