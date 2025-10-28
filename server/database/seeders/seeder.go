package seeders

import (
	"social-forge/internal/infra/repository"

	"go.uber.org/zap"
)

type Seeder struct {
	roleRepo           repository.RoleRepository
	permissionRepo     repository.PermissionRepository
	rolePermissionRepo repository.RolePermissionRepository
	channelRepo        repository.ChannelRepository
	logger             *zap.Logger
}

func NewSeeder(
	roleRepo repository.RoleRepository,
	permissionRepo repository.PermissionRepository,
	rolePermissionRepo repository.RolePermissionRepository,
	channelRepo repository.ChannelRepository,
	logger *zap.Logger,
) *Seeder {
	return &Seeder{
		roleRepo:           roleRepo,
		permissionRepo:     permissionRepo,
		rolePermissionRepo: rolePermissionRepo,
		channelRepo:        channelRepo,
		logger:             logger,
	}
}

func stringPtr(str string) *string {
	return &str
}
