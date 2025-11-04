package app

import (
	"social-forge/internal/dependencies"
	"social-forge/internal/factory"

	"github.com/gofiber/fiber/v2"
)

func RegisterApiRoutes(router fiber.Router, cont *dependencies.Container, mw *factory.MiddlewareFactory) {
	authFactory := factory.NewAuthFactory(cont, mw)
	authFactory.GetRoutes(router)

	userFactory := factory.NewUserFactory(cont, mw)
	userFactory.GetRoutes(router)

	tokenFactory := factory.NewTokenFactory(cont, mw)
	tokenFactory.GetRoutes(router)

	tenantFactory := factory.NewTenantFactory(cont, mw)
	tenantFactory.GetRoutes(router)
}
