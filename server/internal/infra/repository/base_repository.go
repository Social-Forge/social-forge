package repository

import (
	"context"
	"errors"
	"fmt"
	"social-forge/config"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type BaseRepository interface {
	GetDB() *pgxpool.Pool
	BeginTx(ctx context.Context) (pgx.Tx, error)
	CommitTx(ctx context.Context, tx pgx.Tx) error
	RollbackTx(ctx context.Context, tx pgx.Tx) error
	WithTransaction(ctx context.Context, fn func(tx pgx.Tx) error) error
}
type baseRepository struct {
	db *pgxpool.Pool
}

func NewBaseRepository(db *pgxpool.Pool) BaseRepository {
	return &baseRepository{
		db: db,
	}
}
func (r *baseRepository) GetDB() *pgxpool.Pool {
	return r.db
}
func (r *baseRepository) BeginTx(ctx context.Context) (pgx.Tx, error) {
	return r.db.BeginTx(ctx, pgx.TxOptions{
		IsoLevel:       pgx.ReadCommitted,
		AccessMode:     pgx.ReadWrite,
		DeferrableMode: pgx.Deferrable,
	})
}
func (r *baseRepository) CommitTx(ctx context.Context, tx pgx.Tx) error {
	return tx.Commit(ctx)
}
func (r *baseRepository) RollbackTx(ctx context.Context, tx pgx.Tx) error {
	return tx.Rollback(ctx)
}
func (r *baseRepository) WithTransaction(ctx context.Context, fn func(tx pgx.Tx) error) error {
	tx, err := r.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Defer function untuk handle panic dan auto cleanup
	var completed bool
	defer func() {
		if p := recover(); p != nil {
			// Rollback jika ada panic
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				config.Logger.Error("rollback failed after panic", zap.Error(rbErr))
			}
			// Re-panic
			panic(p)
		} else if !completed {
			// Rollback jika function belum completed (misal error)
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				config.Logger.Error("rollback failed", zap.Error(rbErr))
			}
		}
	}()

	// Execute the function
	err = fn(tx)
	if err != nil {
		// Rollback jika function return error
		if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
			config.Logger.Error("rollback failed after error", zap.Error(rbErr))
		}
		return err
	}

	// Commit jika sukses
	if commitErr := tx.Commit(ctx); commitErr != nil {
		return fmt.Errorf("commit failed: %w", commitErr)
	}

	completed = true
	return nil
}

type QueryBuilder struct {
	BaseQuery  string
	Wheres     []string
	Args       []interface{}
	OrderBy    string
	Limit      int
	Offset     int
	argCounter int
}

func NewQueryBuilder(baseQuery string) *QueryBuilder {
	return &QueryBuilder{
		BaseQuery:  baseQuery,
		Wheres:     make([]string, 0),
		Args:       make([]interface{}, 0),
		argCounter: 1,
	}
}

// Where adds a WHERE condition
func (qb *QueryBuilder) Where(condition string, args ...interface{}) *QueryBuilder {
	processedCondition := condition
	for _ = range args {
		placeholder := "$" + strconv.Itoa(qb.argCounter)
		processedCondition = strings.Replace(processedCondition, "$?", placeholder, 1)
		qb.argCounter++
	}

	qb.Wheres = append(qb.Wheres, processedCondition)
	qb.Args = append(qb.Args, args...)
	return qb
}

// OrderByField sets ORDER BY clause
func (qb *QueryBuilder) OrderByField(field string, direction string) *QueryBuilder {
	if direction == "" {
		direction = "ASC"
	}
	safeField := sanitizeField(field)
	safeDirection := strings.ToUpper(direction)
	if safeDirection != "ASC" && safeDirection != "DESC" {
		safeDirection = "ASC"
	}
	qb.OrderBy = safeField + " " + safeDirection
	return qb
}

// WithLimit sets LIMIT clause
func (qb *QueryBuilder) WithLimit(limit int) *QueryBuilder {
	qb.Limit = limit
	return qb
}

// WithOffset sets OFFSET clause
func (qb *QueryBuilder) WithOffset(offset int) *QueryBuilder {
	qb.Offset = offset
	return qb
}

// Build builds the final query
func (qb *QueryBuilder) Build() (string, []interface{}) {
	query := qb.BaseQuery

	if len(qb.Wheres) > 0 {
		query += " WHERE "
		for i, where := range qb.Wheres {
			if i > 0 {
				query += " AND "
			}
			query += where
		}
	}

	if qb.OrderBy != "" {
		query += " ORDER BY " + qb.OrderBy
	}

	if qb.Limit > 0 {
		query += " LIMIT " + string(rune(qb.Limit))
	}

	if qb.Offset > 0 {
		query += " OFFSET " + string(rune(qb.Offset))
	}

	return query, qb.Args
}

func (qb *QueryBuilder) WithoutPagination() *QueryBuilder {
	qb.Limit = 0
	qb.Offset = 0
	qb.OrderBy = ""
	return qb
}
func (qb *QueryBuilder) Clone() *QueryBuilder {
	return &QueryBuilder{
		BaseQuery:  qb.BaseQuery,
		Wheres:     append([]string{}, qb.Wheres...),
		Args:       append([]interface{}{}, qb.Args...),
		OrderBy:    qb.OrderBy,
		Limit:      qb.Limit,
		Offset:     qb.Offset,
		argCounter: qb.argCounter,
	}
}
func (qb *QueryBuilder) ChangeBase(newBase string) *QueryBuilder {
	qb.BaseQuery = newBase
	return qb
}

// Pagination holds pagination information
type Pagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalRows  int64 `json:"total_rows"`
	TotalPages int   `json:"total_pages"`
}

// GetOffset calculates offset for pagination
func (p *Pagination) GetOffset() int {
	return (p.Page - 1) * p.Limit
}

// CalculateTotalPages calculates total pages
func (p *Pagination) CalculateTotalPages() {
	if p.Limit > 0 {
		p.TotalPages = int((p.TotalRows + int64(p.Limit) - 1) / int64(p.Limit))
	}
}

// Filter holds filter parameters
type Filter struct {
	Search               string                 `json:"search,omitempty"`
	Status               string                 `json:"status,omitempty"`
	IncludeDeleted       *bool                  `json:"include_deleted,omitempty"`
	IsActive             *bool                  `json:"is_active,omitempty"`
	IsVerified           *bool                  `json:"is_verified,omitempty"`
	TenantID             *uuid.UUID             `json:"tenant_id,omitempty"`
	UserID               *uuid.UUID             `json:"user_id,omitempty"`
	AssignedAgentID      *uuid.UUID             `json:"assigned_agent_id,omitempty"`
	DivisionID           *uuid.UUID             `json:"division_id,omitempty"`
	ContactID            *uuid.UUID             `json:"contact_id,omitempty"`
	ChannelID            *uuid.UUID             `json:"channel_id,omitempty"`
	ChannelIntegrationID *uuid.UUID             `json:"channel_integration_id,omitempty"`
	SubscriptionPlanID   *string                `json:"subscription_plan_id,omitempty"`
	RoutingType          *string                `json:"routing_type,omitempty"`
	Extra                map[string]interface{} `json:"extra,omitempty"`
}

// ListOptions combines pagination and filtering
type ListOptions struct {
	Pagination *Pagination
	Filter     *Filter
	OrderBy    string
	OrderDir   string
}

// NewListOptions creates default list options
func NewListOptions() *ListOptions {
	return &ListOptions{
		Pagination: &Pagination{
			Page:  1,
			Limit: 10,
		},
		Filter:   &Filter{},
		OrderBy:  "created_at",
		OrderDir: "DESC",
	}
}

func sanitizeField(field string) string {
	// Remove dangerous characters, hanya allow alphanumeric, underscore, dot
	var result strings.Builder
	for _, r := range field {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') || r == '_' || r == '.' {
			result.WriteRune(r)
		}
	}
	return result.String()
}
func isValidColumnName(name string) bool {
	if name == "" || len(name) > 50 {
		return false
	}

	// Hanya allow: letters, numbers, underscore
	for _, r := range name {
		if !((r >= 'a' && r <= 'z') ||
			(r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') ||
			r == '_') {
			return false
		}
	}

	// ❌ Block SQL keywords dan sensitive fields
	blockedKeywords := map[string]bool{
		"password": true, "secret": true, "token": true,
		"delete": true, "drop": true, "insert": true, "update": true,
	}

	return !blockedKeywords[strings.ToLower(name)]
}
