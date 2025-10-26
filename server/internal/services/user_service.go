package services

import (
	"context"
	"fmt"
	"social-forge/internal/dto"
	"social-forge/internal/entity"
	"social-forge/internal/infra/repository"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

type UserService struct {
	userRepo       repository.UserRepository
	roleRepo       repository.RoleRepository
	tenantRepo     repository.TenantRepository
	divisiRepo     repository.DivisionRepository
	userTenantRepo repository.UserTenantRepository
	authService    *AuthService
	logger         *zap.Logger
}

func NewUserService(
	userRepo repository.UserRepository,
	roleRepo repository.RoleRepository,
	tenantRepo repository.TenantRepository,
	divisiRepo repository.DivisionRepository,
	userTenantRepo repository.UserTenantRepository,
	authService *AuthService,
	logger *zap.Logger,
) *UserService {
	return &UserService{
		userRepo:       userRepo,
		roleRepo:       roleRepo,
		tenantRepo:     tenantRepo,
		divisiRepo:     divisiRepo,
		userTenantRepo: userTenantRepo,
		authService:    authService,
		logger:         logger,
	}
}
func (s *UserService) GetUserByID(ctx context.Context, userID string) (*entity.UserTenantWithDetails, error) {
	// Parse userID string to UUID
	userIDUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	userTenant, err := s.userRepo.GetUserTenantWithDetails(ctx, userIDUUID)
	if err != nil {
		return nil, dto.ErrUserNotFound
	}
	s.logger.Info("User found",
		zap.String("user_id", userID),
	)

	return userTenant, nil
}
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*entity.UserTenantWithDetails, error) {
	userEmail, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, dto.ErrUserNotFound
	}
	userTenant, err := s.userRepo.GetUserTenantWithDetails(ctx, userEmail.ID)
	if err != nil {
		return nil, dto.ErrUserNotFound
	}
	s.logger.Info("User found",
		zap.String("email", email),
	)

	return userTenant, nil
}
