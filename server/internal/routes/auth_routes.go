package routes

import (
	"social-forge/internal/handlers"
	"social-forge/internal/middlewares"

	"github.com/gofiber/fiber/v2"
)

type AuthRoutes struct {
	path      string
	handler   *handlers.AuthHandler
	ctxinject *middlewares.ContextMiddleware
	rateLimit *middlewares.RateLimiterMiddleware
}

func NewAuthRoutes(handler *handlers.AuthHandler, ctxinject *middlewares.ContextMiddleware, rateLimit *middlewares.RateLimiterMiddleware) *AuthRoutes {
	return &AuthRoutes{
		path:      "/auth",
		handler:   handler,
		ctxinject: ctxinject,
		rateLimit: rateLimit,
	}
}
func (r *AuthRoutes) RegisterRoutes(app fiber.Router) {
	router := app.Group(r.path)
	router.Post("/register", r.handler.Register)
	router.Post("/login", r.handler.Login)
}
