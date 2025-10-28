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
	logger         *zap.Logger
}

func NewUserService(
	userRepo repository.UserRepository,
	roleRepo repository.RoleRepository,
	tenantRepo repository.TenantRepository,
	divisiRepo repository.DivisionRepository,
	userTenantRepo repository.UserTenantRepository,
	logger *zap.Logger,
) *UserService {
	return &UserService{
		userRepo:       userRepo,
		roleRepo:       roleRepo,
		tenantRepo:     tenantRepo,
		divisiRepo:     divisiRepo,
		userTenantRepo: userTenantRepo,
		logger:         logger,
	}
}
func (s *UserService) GetUserByID(ctx context.Context, userID string) (*entity.UserResponse, error) {
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

	return userTenant.ToResponse(), nil
}
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*entity.UserResponse, error) {
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

	return userTenant.ToResponse(), nil
}
func (s *UserService) GetUserByUsername(ctx context.Context, username string) (*entity.UserResponse, error) {
	userUsername, err := s.userRepo.FindByUsername(ctx, username)
	if err != nil {
		return nil, dto.ErrUserNotFound
	}
	userTenant, err := s.userRepo.GetUserTenantWithDetails(ctx, userUsername.ID)
	if err != nil {
		return nil, dto.ErrUserNotFound
	}
	s.logger.Info("User found",
		zap.String("username", username),
	)

	return userTenant.ToResponse(), nil
}
