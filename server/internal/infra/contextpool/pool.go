package contextpool

import (
	"context"
	"fmt"
	"time"
)

const DefaultTime = 10 * time.Second

func WithTimeoutFallback(ctx context.Context, timeout time.Duration) (context.Context, context.CancelFunc) {
	if ctx == nil {
		ctx = context.Background()
	}
	return context.WithTimeout(ctx, timeout)
}
func WithTimeoutIfNone(ctx context.Context, d time.Duration) (context.Context, context.CancelFunc) {
	if ctx == nil {
		ctx = context.Background()
	}
	if deadline, ok := ctx.Deadline(); ok {
		fmt.Println("Context with duration remaining from sub context : ", time.Until(deadline))
		return ctx, func() {}
	}
	return context.WithTimeout(ctx, d)
}
