package services

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"social-forge/internal/dto"
	"social-forge/internal/entity"
	"social-forge/internal/helpers"
	"social-forge/internal/infra/contextpool"
	minioclient "social-forge/internal/infra/minio-client"
	"social-forge/internal/infra/repository"
	"sync"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

type UserService struct {
	userRepo       repository.UserRepository
	roleRepo       repository.RoleRepository
	tenantRepo     repository.TenantRepository
	divisiRepo     repository.DivisionRepository
	userTenantRepo repository.UserTenantRepository
	userHelper     *helpers.UserHelper
	tokenHelper    *helpers.TokenHelper
	logger         *zap.Logger
	minio          *minioclient.MinioClient
}

func NewUserService(
	userRepo repository.UserRepository,
	roleRepo repository.RoleRepository,
	tenantRepo repository.TenantRepository,
	divisiRepo repository.DivisionRepository,
	userTenantRepo repository.UserTenantRepository,
	userHelper *helpers.UserHelper,
	tokenHelper *helpers.TokenHelper,
	logger *zap.Logger,
	minio *minioclient.MinioClient,
) *UserService {
	return &UserService{
		userRepo:       userRepo,
		roleRepo:       roleRepo,
		tenantRepo:     tenantRepo,
		divisiRepo:     divisiRepo,
		userTenantRepo: userTenantRepo,
		userHelper:     userHelper,
		tokenHelper:    tokenHelper,
		logger:         logger,
		minio:          minio,
	}
}
func (s *UserService) GetUserByID(ctx context.Context, userID string) (*entity.UserResponse, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	userIDUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	userTenant, err := s.userRepo.GetUserTenantWithDetailsByUserID(subCtx, userIDUUID)
	if err != nil {
		s.logger.Error("Failed to get user tenant",
			zap.String("user_id", userTenant.UserTenant.UserID.String()), // ✅ Log user ID yang benar
			zap.String("expected_user_id", userIDUUID.String()),
			zap.Error(err),
		)
		return nil, dto.ErrUserNotFound
	}
	s.logger.Info("User found",
		zap.String("user_id", userID),
	)

	return userTenant.ToResponse(), nil
}
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*entity.UserResponse, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	userEmail, err := s.userRepo.FindByEmail(subCtx, email)
	if err != nil {
		return nil, dto.ErrUserNotFound
	}
	userTenant, err := s.userRepo.GetUserTenantWithDetailsByUserID(subCtx, userEmail.ID)
	if err != nil {
		return nil, dto.ErrUserNotFound
	}
	s.logger.Info("User found",
		zap.String("email", email),
	)

	return userTenant.ToResponse(), nil
}
func (s *UserService) GetUserByUsername(ctx context.Context, username string) (*entity.UserResponse, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	userUsername, err := s.userRepo.FindByUsername(subCtx, username)
	if err != nil {
		return nil, dto.ErrUserNotFound
	}
	userTenant, err := s.userRepo.GetUserTenantWithDetailsByUserID(subCtx, userUsername.ID)
	if err != nil {
		return nil, dto.ErrUserNotFound
	}
	s.logger.Info("User found",
		zap.String("username", username),
	)

	return userTenant.ToResponse(), nil
}
func (s *UserService) Logout(ctx context.Context, userID string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID format: %w", err)
	}

	user, err := s.userRepo.FindByID(subCtx, userUUID)
	if err != nil || user == nil {
		return dto.ErrUserNotFound
	}

	var wg sync.WaitGroup
	errChan := make(chan error, 3)

	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := s.tokenHelper.DeleteAllUserSessions(subCtx, user.ID); err != nil {
			errChan <- fmt.Errorf("failed to clear auth cache: %w", err)
		}
	}()
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := s.userHelper.ClearAllSessionCache(subCtx, userID); err != nil {
			errChan <- fmt.Errorf("failed to clear user cache: %w", err)
		}
	}()

	go func() {
		wg.Wait()
		close(errChan)
	}()

	for err := range errChan {
		if err != nil {
			return fmt.Errorf("failed to logout user: %w", err)
		}
	}

	return nil
}
func (s *UserService) ChangeAvatar(ctx context.Context, userID string, avatarFile *multipart.FileHeader) (string, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return "", fmt.Errorf("invalid user ID format: %w", err)
	}

	user, err := s.userRepo.FindByID(subCtx, userUUID)
	if err != nil || user == nil {
		return "", dto.ErrUserNotFound
	}

	objectName := fmt.Sprintf("user/%s/avatar", userID)

	var wg sync.WaitGroup
	if user.AvatarURL.Valid && user.AvatarURL.String != "" {
		wg.Add(1)
		go func() {
			defer wg.Done()
			// Gunakan background context untuk cleanup ops
			cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cleanupCancel()
			if errDelete := s.minio.DeleteFile(cleanupCtx, objectName); errDelete != nil {
				s.logger.Error("Failed to delete old avatar",
					zap.String("user_id", userID),
					zap.Error(errDelete),
				)
			}
		}()
	}

	file, err := avatarFile.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open avatar file: %w", err)
	}
	defer file.Close()

	_, err = s.minio.UploadImage(subCtx, objectName, file, avatarFile.Size)
	if err != nil {
		return "", fmt.Errorf("failed to upload avatar: %w", err)
	}

	presignedURL, err := s.minio.GetPresignedURL(ctx, objectName, time.Hour*24*7)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	wg.Wait()

	newAvatarURL, err := s.userRepo.UpdateAvatar(subCtx, userUUID, presignedURL)
	if err != nil {
		rollbackCtx, rollbackCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer rollbackCancel()
		if errRollback := s.minio.DeleteFile(rollbackCtx, objectName); errRollback != nil {
			s.logger.Error("Failed to rollback delete avatar",
				zap.String("user_id", userID),
				zap.Error(errRollback),
			)
		}

		return "", fmt.Errorf("failed to update avatar: %w", err)
	}

	return newAvatarURL, nil
}
func (s *UserService) GetAvatarURL(ctx context.Context, userID string) (string, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return "", fmt.Errorf("invalid user ID format: %w", err)
	}

	user, err := s.userRepo.FindByID(subCtx, userUUID)
	if err != nil || user == nil {
		return "", dto.ErrUserNotFound
	}
	if !user.AvatarURL.Valid || user.AvatarURL.String == "" {
		return "", errors.New("user has no avatar")
	}

	presignedUrl, err := s.minio.GetPresignedURL(ctx, user.AvatarURL.String, time.Hour*24*7)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedUrl, nil
}
