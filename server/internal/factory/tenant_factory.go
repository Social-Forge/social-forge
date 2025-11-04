package factory

import (
	"social-forge/internal/dependencies"
	"social-forge/internal/handlers"
	"social-forge/internal/routes"
	"social-forge/internal/services"

	"github.com/gofiber/fiber/v2"
)

type TenantFactory struct {
	service *services.TenantService
	handler *handlers.TenantHandler
	routes  *routes.TenantRoutes
}

func NewTenantFactory(
	cont *dependencies.Container,
	mw *MiddlewareFactory,
) *TenantFactory {
	service := services.NewTenantService(
		cont.TenantRepo,
		cont.Logger,
		cont.MinioClient,
	)
	handler := handlers.NewTenantHandler(
		mw.ContextMiddleware,
		service,
		cont.Logger,
	)
	return &TenantFactory{
		service: service,
		handler: handler,
		routes: routes.NewTenantRoutes(
			handler,
			mw.ContextMiddleware,
			mw.AuthMiddleware,
			mw.TenantMiddleware,
			mw.CSRFMiddleware,
		),
	}
}
func (f *TenantFactory) GetRoutes(parent fiber.Router) {
	f.routes.RegisterRoutes(parent)
}
