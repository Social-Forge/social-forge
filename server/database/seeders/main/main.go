package main

import (
	"context"
	"os"
	"os/signal"
	"social-forge/config"
	"social-forge/database/seeders"
	"social-forge/internal/dependencies"
	"sync"
	"syscall"
	"time"

	"go.uber.org/zap"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	ctxTimeout, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	cont, err := dependencies.NewContainer(ctxTimeout)
	if err != nil {
		config.Logger.Fatal("Failed to initialize dependencies", zap.Error(err))
	}
	defer cont.Close()

	seeder := seeders.NewSeeder(
		cont.RoleRepo,
		cont.PermissionRepo,
		cont.RolePermissionRepo,
		cont.ChannelRepo,
		config.Logger,
	)
	var wg sync.WaitGroup
	wg.Add(1) // Tambahkan counter untuk goroutine seeder

	// wg.Add(1)
	// go func() {
	// 	defer wg.Done()
	// 	if err := seeder.RoleSeed(ctx); err != nil {
	// 		config.Logger.Error("Failed to seed roles", zap.Error(err))
	// 	}
	// }()
	// wg.Add(1)
	// go func() {
	// 	defer wg.Done()
	// 	if err := seeder.PermissionSeed(ctx); err != nil {
	// 		config.Logger.Error("Failed to seed permissions", zap.Error(err))
	// 	}
	// }()

	// wg.Add(1)
	// go func() {
	// 	defer wg.Done()
	// 	if err := seeder.RolePermissionSeed(ctx); err != nil {
	// 		config.Logger.Error("Failed to seed role permissions", zap.Error(err))
	// 	}
	// }()
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := seeder.ChannelSeed(ctx); err != nil {
			config.Logger.Error("Failed to seed channels", zap.Error(err))
		}
	}()
	// if err := seeder.RolePermissionSeed(ctx); err != nil {
	// 	config.Logger.Error("Failed to seed role permissions (Serial Step)", zap.Error(err))
	// }
	wg.Wait()

	config.Logger.Info("✅ All seeders finished execution.")
}
