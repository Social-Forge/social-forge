package repository

import (
	"context"
	"errors"
	"fmt"
	"social-forge/internal/entity"
	"social-forge/internal/infra/contextpool"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WorkingHourRepository interface {
	Create(ctx context.Context, workingHour *entity.WorkingHours) error
	Update(ctx context.Context, workingHour *entity.WorkingHours) (*entity.WorkingHours, error)
	Delete(ctx context.Context, id, tenantID uuid.UUID) error
	HardDelete(ctx context.Context, id, tenantID uuid.UUID) error
	Restore(ctx context.Context, id, tenantID uuid.UUID) error
	Count(ctx context.Context, filter *Filter) (int64, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.WorkingHours, int64, error)
}
type WorkingHourRepositoryImpl struct {
	*baseRepository
}

func NewWorkingHourRepositoryImpl(db *pgxpool.Pool) WorkingHourRepository {
	return &WorkingHourRepositoryImpl{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}

func (r *WorkingHourRepositoryImpl) Create(ctx context.Context, workingHour *entity.WorkingHours) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	tx, err := r.db.Begin(subCtx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(subCtx)

	return r.WithTransaction(subCtx, func(tx pgx.Tx) error {
		query := `
			INSERT INTO working_hours (id, tenant_id, division_id, day_of_week, start_time, end_time, is_active, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT ON CONSTRAINT chk_working_hours_tenant_id_division_id_day_of_week
			DO NOTHING
			RETURNING id, created_at, updated_at
		`
		err := tx.QueryRow(subCtx, query,
			workingHour.ID,
			workingHour.TenantID,
			workingHour.DivisionID,
			workingHour.DayOfWeek,
			workingHour.StartTime,
			workingHour.EndTime,
			workingHour.IsActive,
			workingHour.CreatedAt,
		).Scan(&workingHour.ID, &workingHour.CreatedAt, &workingHour.UpdatedAt)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				switch pgErr.ConstraintName {
				case "chk_working_hours_tenant_id_division_id_day_of_week":
					return fmt.Errorf("working hour for day %d already exists: %w", workingHour.DayOfWeek, err)
				case "chk_working_hours_start_time_end_time":
					return fmt.Errorf("start time must be before end time: %w", err)
				default:
					return fmt.Errorf("failed to insert working hour: %w", err)
				}
			}
			return fmt.Errorf("failed to insert working hour: %w", err)
		}
		return nil
	})
}
func (r *WorkingHourRepositoryImpl) Update(ctx context.Context, workingHour *entity.WorkingHours) (*entity.WorkingHours, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	tx, err := r.db.Begin(subCtx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(subCtx)

	var updateWorkingHour entity.WorkingHours

	return &updateWorkingHour, r.WithTransaction(subCtx, func(tx pgx.Tx) error {
		query := `
			UPDATE working_hours
			SET day_of_week = $1, start_time = $2, end_time = $3, is_active = $4
			WHERE id = $5 AND tenant_id = $6
			RETURNING id, tenant_id, division_id, day_of_week, start_time, end_time, is_active, created_at, updated_at
		`

		err := tx.QueryRow(subCtx, query,
			workingHour.DayOfWeek,
			workingHour.StartTime,
			workingHour.EndTime,
			workingHour.IsActive,
			workingHour.ID,
			workingHour.TenantID,
		).Scan(&updateWorkingHour.ID, &updateWorkingHour.TenantID, &updateWorkingHour.DivisionID, &updateWorkingHour.DayOfWeek, &updateWorkingHour.StartTime, &updateWorkingHour.EndTime, &updateWorkingHour.IsActive, &updateWorkingHour.CreatedAt, &updateWorkingHour.UpdatedAt)

		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				switch pgErr.ConstraintName {
				case "chk_working_hours_tenant_id_division_id_day_of_week":
					return fmt.Errorf("working hour for day %d already exists: %w", workingHour.DayOfWeek, err)
				case "chk_working_hours_start_time_end_time":
					return fmt.Errorf("start time must be before end time: %w", err)
				default:
					return fmt.Errorf("failed to update working hour: %w", err)
				}
			}
			return fmt.Errorf("failed to update working hour: %w", err)
		}
		return nil
	})
}
func (r *WorkingHourRepositoryImpl) Delete(ctx context.Context, id, tenantID uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE working_hours
		SET deleted = NOW()
		WHERE id = $1 AND tenant_id = $2 AND deleted IS NULL
	`

	cmdTag, err := r.db.Exec(subCtx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete working hour: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("working hour not found: %w", err)
	}
	return nil
}
func (r *WorkingHourRepositoryImpl) HardDelete(ctx context.Context, id, tenantID uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		DELETE FROM working_hours
		WHERE id = $1 AND tenant_id = $2
	`

	cmdTag, err := r.db.Exec(subCtx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to hard delete working hour: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("working hour not found: %w", err)
	}
	return nil
}
func (r *WorkingHourRepositoryImpl) Restore(ctx context.Context, id, tenantID uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE working_hours
		SET deleted = NULL
		WHERE id = $1 AND tenant_id = $2 AND deleted IS NOT NULL
	`

	cmdTag, err := r.db.Exec(subCtx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to restore working hour: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("working hour not found: %w", err)
	}
	return nil
}
func (r *WorkingHourRepositoryImpl) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	qb := r.buildQuery("SELECT COUNT(*) FROM working_hours", filter)
	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to count working hours: %w", err)
	}
	return count, nil
}
func (r *WorkingHourRepositoryImpl) Search(ctx context.Context, opts *ListOptions) ([]*entity.WorkingHours, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	qb := r.buildQuery("SELECT * FROM working_hours", opts.Filter)

	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	} else {
		qb.OrderByField("created_at", "DESC")
	}
	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}
	query, args := qb.Build()

	var workingHours []*entity.WorkingHours
	err = pgxscan.Select(subCtx, r.db, &workingHours, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to search working hours: %w", err)
	}
	return workingHours, totalRows, nil
}

func (r *WorkingHourRepositoryImpl) buildQuery(baseQuery string, filter *Filter) *QueryBuilder {
	qb := NewQueryBuilder(baseQuery)

	if filter == nil {
		qb.Where("deleted_at IS NULL")
		return qb
	}
	if filter.IncludeDeleted != nil && *filter.IncludeDeleted {
		qb.Where("deleted_at IS NOT NULL")
	} else {
		qb.Where("deleted_at IS NULL")
	}

	if filter.TenantID != nil {
		qb.Where("tenant_id = $?", *filter.TenantID)
	}
	if filter.DivisionID != nil {
		qb.Where("division_id = $?", *filter.DivisionID)
	}
	if filter.IsActive != nil {
		qb.Where("is_active = $?", *filter.IsActive)
	}
	if filter.Extra != nil {
		if startTime, ok := filter.Extra["start_time"].(time.Time); ok {
			qb.Where("start_time >= $?", startTime)
		}
		if endTime, ok := filter.Extra["end_time"].(time.Time); ok {
			qb.Where("end_time <= $?", endTime)
		}
	}
	return qb
}
