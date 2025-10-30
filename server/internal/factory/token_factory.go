package factory

import (
	"social-forge/internal/dependencies"
	"social-forge/internal/handlers"
	"social-forge/internal/routes"
	"social-forge/internal/services"

	"github.com/gofiber/fiber/v2"
)

type TokenFactory struct {
	service *services.TokenService
	handler *handlers.TokenHandler
	routes  *routes.TokenRoutes
}

func NewTokenFactory(
	cont *dependencies.Container,
	mw *MiddlewareFactory,
) *TokenFactory {
	service := services.NewTokenService(cont.TokenRepo, cont.TokenHelper, cont.Logger)
	handler := handlers.NewTokenHandler(mw.ContextMiddleware, service, cont.Logger)
	return &TokenFactory{
		service: service,
		handler: handler,
		routes:  routes.NewTokenRoutes(handler, mw.ContextMiddleware, mw.AuthMiddleware, mw.CSRFMiddleware),
	}
}
func (f *TokenFactory) GetRoutes(router fiber.Router) {
	f.routes.RegisterRoutes(router)
}
