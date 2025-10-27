package services

import (
	"context"
	"errors"
	"fmt"
	"social-forge/internal/dto"
	"social-forge/internal/entity"
	"social-forge/internal/helpers"
	"social-forge/internal/infra/contextpool"
	"social-forge/internal/infra/repository"
	"social-forge/internal/utils"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type AuthService struct {
	userRepo       repository.UserRepository
	roleRepo       repository.RoleRepository
	permissionRepo repository.PermissionRepository
	sessionRepo    repository.SessionRepository
	tenantRepo     repository.TenantRepository
	userTenantRepo repository.UserTenantRepository
	tokenHelper    *helpers.TokenHelper
	logger         *zap.Logger
	jwtSecret      string
	jwtExpiry      time.Duration
	refreshExpiry  time.Duration
}

func NewAuthService(
	userRepo repository.UserRepository,
	roleRepo repository.RoleRepository,
	permissionRepo repository.PermissionRepository,
	sessionRepo repository.SessionRepository,
	tenantRepo repository.TenantRepository,
	userTenantRepo repository.UserTenantRepository,
	tokenHelper *helpers.TokenHelper,
	logger *zap.Logger,
	jwtSecret string,
	jwtExpiryHours int,
	refreshExpiryHours int,
) *AuthService {
	return &AuthService{
		userRepo:       userRepo,
		roleRepo:       roleRepo,
		permissionRepo: permissionRepo,
		sessionRepo:    sessionRepo,
		tenantRepo:     tenantRepo,
		userTenantRepo: userTenantRepo,
		tokenHelper:    tokenHelper,
		logger:         logger,
		jwtSecret:      jwtSecret,
		jwtExpiry:      time.Duration(jwtExpiryHours) * time.Hour,
		refreshExpiry:  time.Duration(refreshExpiryHours) * time.Hour,
	}
}
func (s *AuthService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	user, err := s.userRepo.FindByEmailOrUsername(subCtx, req.Identifier)
	if err != nil {
		s.logger.Warn("Login failed: user not found",
			zap.String("identifier", req.Identifier),
			zap.Error(err),
		)
		return nil, dto.ErrInvalidCredentials
	}

	if !user.IsActive {
		s.logger.Warn("Login failed: user inactive",
			zap.String("identifier", req.Identifier),
			zap.Any("user_id", user.ID),
		)
		return nil, dto.ErrUserInactive
	}

	if !utils.VerifyPassword(user.PasswordHash, req.Password) {
		s.logger.Warn("Login failed: invalid password",
			zap.String("identifier", req.Identifier),
			zap.Any("user_id", user.ID),
		)
		return nil, dto.ErrInvalidCredentials
	}

	userTenant, err := s.userRepo.GetUserTenantWithDetails(subCtx, user.ID)
	if err != nil {
		s.logger.Error("Failed to get user tenant",
			zap.Any("user_id", user.ID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to get user tenant: %w", err)
	}

	roleNames, permsName, permissionResources, actionName := s.getUserRolePermissions(subCtx, userTenant)

	tokenPayload := &entity.TokenMetadata{
		UserID:             user.ID,
		Email:              user.Email,
		TenantID:           &userTenant.Tenant.ID,
		UserTenantID:       &userTenant.UserTenant.ID,
		Role:               &userTenant.Role,
		RoleName:           roleNames,
		PermissionName:     permsName,
		PermissionResource: permissionResources,
		PermissionAction:   actionName,
		Metadata:           userTenant.Metadata,
	}

	accessToken, err := utils.GenerateJWT(s.jwtSecret, tokenPayload, s.jwtExpiry)
	if err != nil {
		s.logger.Error("Failed to generate access token",
			zap.Any("user_id", user.ID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := utils.GenerateJWT(s.jwtSecret, tokenPayload, s.refreshExpiry)
	if err != nil {
		s.logger.Error("Failed to generate refresh token",
			zap.Any("user_id", user.ID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	if err := s.userRepo.UpdateLastLogin(ctx, user.ID); err != nil {
		s.logger.Warn("Failed to update last login",
			zap.Any("user_id", user.ID),
			zap.Error(err),
		)
	}

	if err := s.tokenHelper.SetSessionToken(ctx, accessToken, tokenPayload, s.jwtExpiry); err != nil {
		s.logger.Error("Failed to save session",
			zap.Any("user_id", user.ID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to save session: %w", err)
	}

	s.logger.Info("User logged in successfully",
		zap.Any("user_id", user.ID),
		zap.String("email", user.Email),
	)

	return &dto.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.jwtExpiry.Seconds()),
		User: &entity.UserResponse{
			ID:              user.ID,
			Email:           user.Email,
			Username:        user.Username,
			FullName:        user.FullName,
			Phone:           user.Phone,
			AvatarURL:       user.AvatarURL,
			TwoFaSecret:     user.TwoFaSecret,
			IsVerified:      user.IsVerified,
			IsActive:        user.IsActive,
			EmailVerifiedAt: user.EmailVerifiedAt,
			LastLoginAt:     user.LastLoginAt,
			CreatedAt:       user.CreatedAt,
			UpdatedAt:       user.UpdatedAt,
			Tenant:          userTenant.Tenant,
			UserTenant:      userTenant.UserTenant,
			Role:            userTenant.Role,
			RolePermissions: userTenant.RolePermissions,
			Metadata:        userTenant.Metadata,
		},
	}, nil
}
func (s *AuthService) Register(ctx context.Context, req *dto.RegisterUserRequest) (*entity.User, error) {
	// Check if email already exists
	existingUser, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		s.logger.Warn("Registration failed: email already registered",
			zap.String("email", req.Email),
		)
		return nil, dto.ErrEmailAlreadyExists
	}
	// Check if username already exists
	exists, err := s.userRepo.ExistsByUsername(ctx, req.Username)
	if err == nil && exists {
		s.logger.Warn("Registration failed: username already registered",
			zap.String("username", req.Username),
		)
		return nil, dto.ErrUsernameAlreadyExists
	}
	// Check if phone already exists
	exists, err = s.userRepo.ExistsByPhone(ctx, req.Phone)
	if err == nil && exists {
		s.logger.Warn("Registration failed: phone already registered",
			zap.String("phone", req.Phone),
		)
		return nil, dto.ErrPhoneAlreadyExists
	}
	// Check if password is weak
	if !utils.IsStrongPassword(req.Password) {
		s.logger.Warn("Registration failed: weak password",
			zap.String("email", req.Email),
		)
		return nil, dto.ErrWeakPassword
	}

	hashPassword, err := utils.GeneratePasswordHash(req.Password)
	if err != nil {
		s.logger.Error("Failed to hash password",
			zap.String("email", req.Email),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	userUUID := uuid.New()
	tenantUUID := uuid.New()
	userTenantUUID := uuid.New()
	fullName := fmt.Sprintf("%s %s", req.FirstName, req.LastName)

	user := &entity.User{
		ID:           userUUID,
		Email:        req.Email,
		Username:     req.Username,
		FullName:     fullName,
		Phone:        &req.Phone,
		PasswordHash: hashPassword,
		IsVerified:   false,
		IsActive:     true,
	}
	if err = s.userRepo.Create(ctx, user); err != nil {
		s.logger.Error("Failed to create user",
			zap.Any("user_id", user.ID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	tenant := &entity.Tenant{
		ID:                 tenantUUID,
		Name:               fullName,
		Slug:               utils.GenerateSlugUnicodeV2(fullName),
		OwnerID:            userUUID,
		MaxDivisions:       1,
		MaxAgents:          1,
		MaxQuickReplies:    1,
		MaxMetaWhatsApp:    0,
		MaxWhatsApp:        0,
		MaxMetaMessenger:   1,
		MaxInstagram:       1,
		MaxTelegram:        1,
		MaxWebChat:         1,
		MaxLinkChat:        1,
		MaxPages:           1,
		SubscriptionStatus: entity.StatusActive,
		SubscriptionPlan:   entity.PlanFree,
		TrialEndsAt:        utils.TimePtr(time.Now().AddDate(0, 0, 7)),
		CreatedAt:          time.Now(),
	}
	if err = s.tenantRepo.Create(ctx, tenant); err != nil {
		s.logger.Error("Failed to create tenant",
			zap.Any("tenant_id", tenant.ID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to create tenant: %w", err)
	}

	role, err := s.roleRepo.GetByName(ctx, entity.RoleTenantOwner)
	if err != nil {
		s.logger.Error("Failed to get role",
			zap.String("role_name", entity.RoleTenantOwner),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to get role: %w", err)
	}

	userTenant := &entity.UserTenant{
		ID:        userTenantUUID,
		UserID:    userUUID,
		TenantID:  tenantUUID,
		RoleID:    role.ID,
		CreatedAt: time.Now(),
	}
	_, err = s.userTenantRepo.Create(ctx, userTenant)
	if err != nil {
		s.logger.Error("Failed to create user tenant",
			zap.Any("user_tenant_id", userTenant.ID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to create user tenant: %w", err)
	}
	return user, nil
}

func (s *AuthService) ValidateToken(tokenString string) (*dto.JWTClaims, error) {
	token, err := utils.VerifyJWT(tokenString, s.jwtSecret)
	if err != nil {
		s.logger.Debug("Token validation failed", zap.Error(err))
		return nil, dto.ErrInvalidToken
	}
	if !token.Valid {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, fmt.Errorf("unauthorized - invalid or expired token: %w", err)
		}
		return nil, dto.ErrInvalidToken
	}

	if claims, ok := token.Claims.(*dto.JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, dto.ErrInvalidToken
}
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*dto.LoginResponse, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	claims, err := s.ValidateToken(refreshToken)
	if err != nil {
		return nil, err
	}

	userUUID, err := uuid.Parse(claims.UserID)
	if err != nil {
		s.logger.Error("Invalid user ID format",
			zap.Any("user_id", claims.UserID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	userTenant, err := s.userRepo.GetUserTenantWithDetails(subCtx, userUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user tenant: %w", err)
	}
	roleNames, permsName, permissionResources, actionName := s.getUserRolePermissions(subCtx, userTenant)

	tokenPayload := &entity.TokenMetadata{
		UserID:             userTenant.User.ID,
		Email:              userTenant.User.Email,
		TenantID:           &userTenant.Tenant.ID,
		UserTenantID:       &userTenant.UserTenant.ID,
		Role:               &userTenant.Role,
		RoleName:           roleNames,
		PermissionName:     permsName,
		PermissionResource: permissionResources,
		PermissionAction:   actionName,
		Metadata:           userTenant.Metadata,
	}

	accessToken, err := utils.GenerateJWT(s.jwtSecret, tokenPayload, s.jwtExpiry)
	if err != nil {
		s.logger.Error("Failed to generate access token",
			zap.Any("user_id", tokenPayload.UserID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err = utils.GenerateJWT(s.jwtSecret, tokenPayload, s.refreshExpiry)
	if err != nil {
		s.logger.Error("Failed to generate refresh token",
			zap.Any("user_id", tokenPayload.UserID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &dto.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.jwtExpiry.Seconds()),
		User: &entity.UserResponse{
			ID:              userTenant.User.ID,
			Email:           userTenant.User.Email,
			Username:        userTenant.User.Username,
			FullName:        userTenant.User.FullName,
			Phone:           userTenant.User.Phone,
			AvatarURL:       userTenant.User.AvatarURL,
			TwoFaSecret:     userTenant.User.TwoFaSecret,
			IsVerified:      userTenant.User.IsVerified,
			IsActive:        userTenant.User.IsActive,
			EmailVerifiedAt: userTenant.User.EmailVerifiedAt,
			LastLoginAt:     userTenant.User.LastLoginAt,
			CreatedAt:       userTenant.User.CreatedAt,
			UpdatedAt:       userTenant.User.UpdatedAt,
			Tenant:          userTenant.Tenant,
			UserTenant:      userTenant.UserTenant,
			Role:            userTenant.Role,
			RolePermissions: userTenant.RolePermissions,
			Metadata:        userTenant.Metadata,
		},
	}, nil
}
func (s *AuthService) CheckPermission(ctx context.Context, userID uuid.UUID, permission string) error {
	// Get user
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return dto.ErrUserNotFound
	}

	if !user.IsActive {
		return dto.ErrUserInactive
	}

	role, err := s.roleRepo.FindByID(ctx, user.ID)
	if err != nil {
		return fmt.Errorf("failed to get role: %w", err)
	}

	// Get user permissions
	permissions, err := s.permissionRepo.FindByRoleID(ctx, role.ID)
	if err != nil {
		return fmt.Errorf("failed to get permissions: %w", err)
	}

	// Check if permission exists
	for _, p := range permissions {
		if p.Name == permission {
			return nil
		}
	}

	s.logger.Warn("Permission denied",
		zap.Any("user_id", userID),
		zap.String("permission", permission),
	)

	return dto.ErrPermissionDenied
}
func (s *AuthService) CheckPermissions(ctx context.Context, userID uuid.UUID, requiredPermissions []string) error {
	for _, permission := range requiredPermissions {
		if err := s.CheckPermission(ctx, userID, permission); err != nil {
			return err
		}
	}
	return nil
}
func (s *AuthService) Logout(ctx context.Context, userID string) error {
	// TODO: Implement session invalidation in Redis
	// For now, just log the logout
	s.logger.Info("User logged out", zap.String("user_id", userID))
	return nil
}
func (s *AuthService) SaveSession(ctx context.Context, accToken, refToken string, userID uuid.UUID) error {
	session := &entity.Session{
		ID:             uuid.Must(uuid.NewRandom()),
		UserID:         userID,
		AccessToken:    accToken,
		RefreshToken:   refToken,
		ExpiresAt:      time.Now().Add(s.jwtExpiry),
		LastActivityAt: utils.TimePtr(time.Now()),
		CreatedAt:      time.Now(),
	}
	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return fmt.Errorf("failed to save session: %w", err)
	}
	return nil
}
func (s *AuthService) getUserRolePermissions(ctx context.Context, metaData *entity.UserTenantWithDetails) ([]string, []string, []string, []string) {
	var roleNames []string
	var permissionNames []string
	var permissionResources []string
	var permissionActions []string

	for _, roleID := range metaData.RolePermissions {
		roleNames = append(roleNames, roleID.RoleName)
		permissionNames = append(permissionNames, roleID.PermissionName)
		permissionResources = append(permissionResources, roleID.PermissionResource)
		permissionActions = append(permissionActions, roleID.PermissionAction)
	}
	return roleNames, permissionNames, permissionResources, permissionActions

}
