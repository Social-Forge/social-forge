package factory

import (
	"social-forge/internal/dependencies"
	"social-forge/internal/handlers"
	"social-forge/internal/routes"
	"social-forge/internal/services"

	"github.com/gofiber/fiber/v2"
)

type UserFactory struct {
	service *services.UserService
	handler *handlers.UserHandler
	routes  *routes.UserRoutes
}

func NewUserFactory(cont *dependencies.Container, mw *MiddlewareFactory) *UserFactory {
	service := services.NewUserService(
		cont.UserRepo,
		cont.RoleRepo,
		cont.TenantRepo,
		cont.DivisionRepo,
		cont.UserTenantRepo,
		cont.Logger,
	)
	handler := handlers.NewUserHandler(
		mw.ContextMiddleware,
		service,
		mw.RateLimiter,
		cont.Logger,
	)
	return &UserFactory{
		service: service,
		handler: handler,
		routes: routes.NewUserRoutes(
			handler,
			mw.ContextMiddleware,
			mw.RateLimiter,
			mw.AuthMiddleware,
			mw.CSRFMiddleware,
			mw.TenantMiddleware,
		),
	}
}
func (f *UserFactory) GetRoutes(parent fiber.Router) {
	f.routes.RegisterRoutes(parent)
}
