package app

import (
	"context"
	"regexp"
	"social-forge/config"
	"social-forge/internal/dependencies"
	"social-forge/internal/factory"
	"social-forge/internal/infra/metrics"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

var App *fiber.App

func Start(cont *dependencies.Container) {
	App = fiber.New(fiber.Config{
		BodyLimit:    10 * 1024 * 1024, // 10MB global limit
		AppName:      cont.Config.App.Name,
		ProxyHeader:  fiber.HeaderXForwardedFor,
		WriteTimeout: 10 * time.Second,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return fiber.DefaultErrorHandler(c, err)
		},
	})
	setupMiddlewares(App, cont)

	port := normalizePort(cont.Config.App.Port)
	cont.Logger.Info("Starting server", zap.String("port", port))

	if err := App.Listen(":" + port); err != nil {
		config.Logger.Fatal("Server failed to start", zap.Error(err))
	}
}
func setupMiddlewares(app *fiber.App, cont *dependencies.Container) {
	middleware := factory.NewMiddlewareFactory(cont)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello from Go backend!")
	})

	app.Use(func(c *fiber.Ctx) error {
		config.Logger.Info("---Request---", zap.String("path", c.Path()))
		ip := c.Get("X-Forwarded-For")
		if ip == "" {
			ip = c.IP()
		}
		c.Locals("real_ip", ip)
		return c.Next()
	})
	app.Use(
		middleware.ContextMiddleware.TimeoutContext(60*time.Second),
		middleware.Recovery.NewRecoveryMiddleware(),
		middleware.ApiMiddleware.SetupCompression(),
		middleware.ApiMiddleware.SetupCORS(),
		middleware.PlatformMiddleware.Setup(),
		middleware.ApiMiddleware.SetupLogger(),
		middleware.ApiMiddleware.SetupRequestID(),
		middleware.ApiMiddleware.SetupMetrics(cont.Logger),
		metrics.HTTPMetrics(metrics.GetAppMetrics()),
	)

	apiRoutes := app.Group("/api")
	apiRoutes.Use(
		middleware.ContextMiddleware.SetTimeout(60*time.Second),
		middleware.Recovery.NewRecoveryMiddleware(),
		middleware.RateLimiter.GlobalRequestLimiter(),
	)
	RegisterApiRoutes(apiRoutes, cont, middleware)
}
func Shutdown(ctx context.Context) error {
	if App != nil {
		return App.ShutdownWithContext(ctx)
	}
	return nil
}
func normalizePort(port string) string {
	if port == "" {
		port = "8080"
	}
	// Hanya ambil angka
	re := regexp.MustCompile(`\d+`)
	matches := re.FindAllString(port, -1)
	if len(matches) > 0 {
		return matches[0]
	}
	return "8080"
}
