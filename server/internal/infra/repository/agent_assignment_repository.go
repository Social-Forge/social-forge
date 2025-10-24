package repository

import (
	"context"
	"errors"
	"fmt"
	"social-forge/internal/entity"
	"social-forge/internal/infra/contextpool"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AgentAssignmentRepository interface {
	Create(ctx context.Context, assignment *entity.AgentAssignment) error
	Update(ctx context.Context, assignment *entity.AgentAssignment) (*entity.AgentAssignment, error)
	GetByID(ctx context.Context, id string) (*entity.AgentAssignment, error)
	ListByTenantID(ctx context.Context, tenantID string) ([]*entity.AgentAssignment, error)
	Delete(ctx context.Context, assignment *entity.AgentAssignment) error
	IncrementAssignedCount(ctx context.Context, id string) error
	IncrementResolvedCount(ctx context.Context, id string) error
	IncrementAvgResponseTime(ctx context.Context, id string, avgResponseTime float64) error
}
type agentAssignmentRepository struct {
	*baseRepository
}

func NewAgentAssignmentRepository(db *pgxpool.Pool) AgentAssignmentRepository {
	return &agentAssignmentRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}

func (r *agentAssignmentRepository) Create(ctx context.Context, assignment *entity.AgentAssignment) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
	INSERT INTO agent_assignments (id, user_id, tenant_id, division_id, is_active, status, assigned_count, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	ON CONFLICT ON CONSTRAINT chk_agent_assignment_division_id_user_id DO NOTHING
	RETURNING id, created_at
	`
	err := r.db.QueryRow(subCtx, query, assignment.ID, assignment.UserID, assignment.TenantID, assignment.DivisionID, assignment.IsActive, assignment.Status, assignment.AssignedCount, assignment.CreatedAt, assignment.UpdatedAt).Scan(&assignment.ID, &assignment.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "chk_agent_assignment_division_id_user_id":
				return fmt.Errorf("agent assignment already exists for user %s in division %s: %w", assignment.UserID, assignment.DivisionID, err)
			case "chk_agent_assignment_status":
				return fmt.Errorf("agent assignment status is invalid: %w", err)
			default:
				return fmt.Errorf("create agent assignment failed: %w", err)
			}
		}
		return fmt.Errorf("create agent assignment failed: %w", err)
	}
	return nil
}
func (r *agentAssignmentRepository) Update(ctx context.Context, assignment *entity.AgentAssignment) (*entity.AgentAssignment, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
	UPDATE agent_assignments
	SET is_active = $1, status = $2, assigned_count = $3, resolved_count = $4, avg_response_time = $5
	WHERE id = $6
	RETURNING id, user_id, tenant_id, division_id, is_active, status, assigned_count, resolved_count, avg_response_time, created_at, updated_at
	`
	err := r.db.QueryRow(subCtx, query, assignment.IsActive, assignment.Status, assignment.AssignedCount, assignment.ResolvedCount, assignment.UpdatedAt, assignment.ID).Scan(&assignment.ID, &assignment.UserID, &assignment.TenantID, &assignment.DivisionID, &assignment.IsActive, &assignment.Status, &assignment.AssignedCount, &assignment.ResolvedCount, &assignment.AvgResponseTime, &assignment.CreatedAt, &assignment.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "chk_agent_assignment_division_id_user_id":
				return nil, fmt.Errorf("agent assignment already exists for user %s in division %s: %w", assignment.UserID, assignment.DivisionID, err)
			case "chk_agent_assignment_status":
				return nil, fmt.Errorf("agent assignment status is invalid: %w", err)
			default:
				return nil, fmt.Errorf("update agent assignment failed: %w", err)
			}
		}
		return nil, fmt.Errorf("update agent assignment failed: %w", err)
	}
	return assignment, nil
}
func (r *agentAssignmentRepository) GetByID(ctx context.Context, id string) (*entity.AgentAssignment, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
	SELECT * FROM agent_assignments WHERE id = $1
	`
	var assignment entity.AgentAssignment
	err := pgxscan.Get(subCtx, r.db, &assignment, query, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("agent assignment not found: %w", err)
		}
		return nil, fmt.Errorf("get agent assignment by id failed: %w", err)
	}
	return &assignment, nil
}
func (r *agentAssignmentRepository) ListByTenantID(ctx context.Context, tenantID string) ([]*entity.AgentAssignment, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
	SELECT * FROM agent_assignments WHERE tenant_id = $1
	`
	var assignments []*entity.AgentAssignment
	err := pgxscan.Select(subCtx, r.db, &assignments, query, tenantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("no agent assignments found for tenant %s: %w", tenantID, err)
		}
		return nil, fmt.Errorf("list agent assignments by tenant id failed: %w", err)
	}
	return assignments, nil
}
func (r *agentAssignmentRepository) Delete(ctx context.Context, assignment *entity.AgentAssignment) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
	DELETE FROM agent_assignments WHERE id = $1
	`
	cmdTag, err := r.db.Exec(subCtx, query, assignment.ID)
	if err != nil {
		return fmt.Errorf("delete agent assignment failed: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("agent assignment not found: %w", err)
	}
	return nil
}
func (r *agentAssignmentRepository) IncrementAssignedCount(ctx context.Context, id string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
	UPDATE agent_assignments SET assigned_count = assigned_count + 1 WHERE id = $1
	`
	cmdTag, err := r.db.Exec(subCtx, query, id)
	if err != nil {
		return fmt.Errorf("increment assigned count failed: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("agent assignment not found: %w", err)
	}
	return nil
}
func (r *agentAssignmentRepository) IncrementResolvedCount(ctx context.Context, id string) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
	UPDATE agent_assignments SET resolved_count = resolved_count + 1 WHERE id = $1
	`
	cmdTag, err := r.db.Exec(subCtx, query, id)
	if err != nil {
		return fmt.Errorf("increment resolved count failed: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("agent assignment not found: %w", err)
	}
	return nil
}
func (r *agentAssignmentRepository) IncrementAvgResponseTime(ctx context.Context, id string, avgResponseTime float64) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
	UPDATE agent_assignments SET avg_response_time = ($1 + avg_response_time * ($2 - 1)) / $2 WHERE id = $3
	`
	cmdTag, err := r.db.Exec(subCtx, query, avgResponseTime, avgResponseTime, id)
	if err != nil {
		return fmt.Errorf("increment avg response time failed: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("agent assignment not found: %w", err)
	}
	return nil
}
