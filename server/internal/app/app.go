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
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"go.uber.org/zap"
)

var App *fiber.App

func Start(cont *dependencies.Container) {
	App = fiber.New(fiber.Config{
		BodyLimit:    50 * 1024 * 1024,
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
func RegisterAllRoutes(router fiber.Router, cont *dependencies.Container, mw *factory.MiddlewareFactory) {

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
		compress.New(compress.Config{
			Level: compress.LevelDefault,
		}),
		cors.New(cors.Config{
			AllowOriginsFunc: nil,
			AllowOrigins:     "*",
			AllowHeaders:     "Origin, Referer, Host, Content-Type, Accept, X-Forwarded-Origin, X-Forwarded-Host, Authorization, X-Client-Platform, X-Package-ID, X-XSRF-TOKEN, X-Xsrf-Token, X-Requested-With, X-Original-Url, X-Forwarded-Referer, X-Real-Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto, User-Agent, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, X-2FA-Session, X-Require-Confirm",
			AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
			AllowCredentials: false,
			ExposeHeaders:    "Content-Length, X-Request-ID, X-Require-Confirm, X-2FA-Session",
			MaxAge:           86400, // 24 jam
			// Next: func(c *fiber.Ctx) bool {
			// 	return middleware.Client.ClientGuardFiber(c)
			// },
		}),
		metrics.HTTPMetrics(metrics.GetAppMetrics()),
	)

	apiRoutes := app.Group("/api")
	apiRoutes.Use(
		middleware.ContextMiddleware.SetTimeout(60*time.Second),
		middleware.Recovery.NewRecoveryMiddleware(),
		middleware.RateLimiter.GlobalRequestLimiter(),
	)
	RegisterAllRoutes(apiRoutes, cont, middleware)
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
