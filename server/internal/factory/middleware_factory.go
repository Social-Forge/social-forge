package factory

import (
	"social-forge/internal/dependencies"
	"social-forge/internal/middlewares"
)

type MiddlewareFactory struct {
	ContextMiddleware *middlewares.ContextMiddleware
	Recovery          *middlewares.RecoveryMiddleware
	RateLimiter       *middlewares.RateLimiterMiddleware
	ApiMiddleware     *middlewares.ApiMiddleware
}

func NewMiddlewareFactory(cont *dependencies.Container) *MiddlewareFactory {
	ctxinject := middlewares.NewContextMiddleware(cont.Logger)
	return &MiddlewareFactory{
		ContextMiddleware: ctxinject,
		Recovery:          middlewares.NewRecoveryMiddleware(ctxinject, cont.Logger, cont.Notifier),
		RateLimiter:       middlewares.NewRateLimiterMiddleware(ctxinject, cont.RedisClient),
		ApiMiddleware:     middlewares.NewApiMiddleware(),
	}
}
