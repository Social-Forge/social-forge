package middlewares

import (
	"fmt"
	"social-forge/config"
	"social-forge/internal/helpers"
	"social-forge/internal/infra/contextpool"
	redisclient "social-forge/internal/infra/redis-client"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type RateLimiterMiddleware struct {
	ctxinjext   *ContextMiddleware
	redisClient *redisclient.RedisClient
}

func NewRateLimiterMiddleware(
	ctxinject *ContextMiddleware,
	redisClient *redisclient.RedisClient,
) *RateLimiterMiddleware {
	return &RateLimiterMiddleware{
		ctxinjext:   ctxinject,
		redisClient: redisClient,
	}
}
func (rm *RateLimiterMiddleware) ProgressDelay(key string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		ctx := rm.ctxinjext.From(c)
		defer rm.ctxinjext.LogDuration(ctx, c.Path())

		attemptsKey := fmt.Sprintf("delay:%s:%s", key, c.Locals("real_ip").(string))

		attempts, err := rm.redisClient.GetInt(ctx, attemptsKey)
		if err != nil && err != redis.Nil {
			config.Logger.Error("Redis error", zap.Error(err))
			return c.Next()
		}

		if attempts >= 3 {
			delay := time.Duration(attempts-2) * time.Second
			time.Sleep(delay)
		}
		return c.Next()
	}
}
func (rm *RateLimiterMiddleware) ResetLimitCounters(c *fiber.Ctx) {
	ctx := rm.ctxinjext.From(c)
	defer rm.ctxinjext.LogDuration(ctx, c.Path())

	ctx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	ip := c.Locals("real_ip").(string)
	patterns := []string{
		fmt.Sprintf("rate:%s:%s", "login", ip),
		fmt.Sprintf("delay:%s:%s", "forgot", ip),
		fmt.Sprintf("block:%s:%s", "confirm_password", ip),
	}

	for _, pattern := range patterns {
		rm.redisClient.DeleteCache(ctx, pattern)
	}
}
func (rm *RateLimiterMiddleware) GlobalRequestLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		KeyGenerator: func(c *fiber.Ctx) string {
			ip := c.Locals("real_ip").(string)
			return fmt.Sprintf("global:%s:%s", ip, c.Method())
		},
		Max:        100,
		Expiration: 1 * time.Minute,
		Storage:    rm.redisClient,
		LimitReached: func(c *fiber.Ctx) error {
			retryAfter := c.GetRespHeader("Retry-After")
			return helpers.Respond(c, fiber.StatusTooManyRequests, "global_rate_limit_exceeded", fiber.Map{
				"retry_after": retryAfter,
			})
		},
	})
}
func (rm *RateLimiterMiddleware) BaseLimiter(key string, max int, expiration time.Duration) fiber.Handler {
	return limiter.New(limiter.Config{
		KeyGenerator: func(c *fiber.Ctx) string {
			ip := c.Locals("real_ip").(string)
			return fmt.Sprintf("rate:%s:%s", key, ip)
		},
		Storage:      rm.redisClient,
		Max:          max,
		Expiration:   expiration,
		LimitReached: defaultLimitReachedHandler,
	})
}
func (rm *RateLimiterMiddleware) BlockLimiter(key string, maxAttempts int, blockDuration time.Duration) fiber.Handler {
	return limiter.New(limiter.Config{
		KeyGenerator: func(c *fiber.Ctx) string {
			ip := c.Locals("real_ip").(string)
			return fmt.Sprintf("block:%s:%s", key, ip)
		},
		Storage:      rm.redisClient,
		Max:          maxAttempts,
		Expiration:   blockDuration,
		LimitReached: blockLimitReachedHandler(blockDuration),
	})
}
func defaultLimitReachedHandler(c *fiber.Ctx) error {
	return helpers.Respond(c, fiber.StatusTooManyRequests, "You have reached the request limit. Please try again later.", nil)
}
func blockLimitReachedHandler(blockDuration time.Duration) func(c *fiber.Ctx) error {
	return func(c *fiber.Ctx) error {
		msg := fmt.Sprintf("Too many attempts. Please try again after %v.", blockDuration)
		return helpers.Respond(c, fiber.StatusTooManyRequests, msg, fiber.Map{
			"block_duration": blockDuration,
		})
	}
}
