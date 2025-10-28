package routes

import (
	"social-forge/internal/handlers"
	"social-forge/internal/middlewares"

	"github.com/gofiber/fiber/v2"
)

type UserRoutes struct {
	path      string
	handler   *handlers.UserHandler
	ctxinject *middlewares.ContextMiddleware
	limiter   *middlewares.RateLimiterMiddleware
	auth      *middlewares.AuthMiddleware
	csrf      *middlewares.CSRFMiddleware
	tenant    *middlewares.TenantMiddleware
}

func NewUserRoutes(
	handler *handlers.UserHandler,
	ctxinject *middlewares.ContextMiddleware,
	limiter *middlewares.RateLimiterMiddleware,
	auth *middlewares.AuthMiddleware,
	csrf *middlewares.CSRFMiddleware,
	tenant *middlewares.TenantMiddleware,
) *UserRoutes {
	return &UserRoutes{
		path:      "/user",
		handler:   handler,
		ctxinject: ctxinject,
		limiter:   limiter,
		auth:      auth,
		csrf:      csrf,
		tenant:    tenant,
	}
}
func (r *UserRoutes) RegisterRoutes(parent fiber.Router) {
	router := parent.Group(r.path)

	router.Get("/me", r.auth.JWTAuth(), r.tenant.TenantGuard(), r.handler.GetCurrentUser)
}
