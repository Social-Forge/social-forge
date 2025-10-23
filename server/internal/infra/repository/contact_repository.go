package repository

import (
	"context"
	"errors"
	"fmt"
	"social-forge/internal/entity"
	"social-forge/internal/infra/contextpool"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ContactRepository interface {
	BaseRepository
	Create(ctx context.Context, contact *entity.Contact) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Contact, error)
	FindByChannelUserID(ctx context.Context, tenantID, channelID uuid.UUID, channelUserID string) (*entity.Contact, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.Contact, error)
	Count(ctx context.Context, tenantID uuid.UUID, filter *Filter) (int64, error)
	Update(ctx context.Context, contact *entity.Contact) (*entity.Contact, error)
	Delete(ctx context.Context, id uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
}

type contactRepository struct {
	*baseRepository
}

func NewContactRepository(db *pgxpool.Pool) ContactRepository {
	return &contactRepository{
		baseRepository: NewBaseRepository(db).(*baseRepository),
	}
}
func (r *contactRepository) Create(ctx context.Context, contact *entity.Contact) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `INSERT INTO contacts (id, tenant_id, name, email, phone, avatar_url, channel_id, channel_user_id,
			metadata, label_ids, tags, is_blocked, created_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	RETURNING id, created_at, updated_at
	`
	args := []interface{}{
		contact.ID, contact.TenantID, contact.Name, contact.Email, contact.Phone, contact.AvatarURL,
		contact.ChannelID, contact.ChannelUserID, contact.Metadata, contact.LabelIDs, contact.Tags, contact.IsBlocked, contact.CreatedAt,
	}

	err := r.db.QueryRow(subCtx, query, args...).Scan(&contact.ID, &contact.CreatedAt, &contact.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23505" {
			switch pgErr.ConstraintName {
			case "idx_contacts_unique_non_null_email":
				return fmt.Errorf("contact with this email already exists: %w", err)
			case "idx_contacts_unique_non_null_phone":
				return fmt.Errorf("contact with this phone number already exists: %w", err)
			default:
				return fmt.Errorf("unique constraint violation: %w", err)
			}
		}
		return fmt.Errorf("failed to create contact: %w", err)
	}

	return nil
}
func (r *contactRepository) Update(ctx context.Context, contact *entity.Contact) (*entity.Contact, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `UPDATE contacts
	SET name = $1, email = $2, phone = $3, avatar_url = $4, metadata = $5, label_ids = $6, tags = $7, is_blocked = $8
	WHERE id = $9
	RETURNING id, tenant_id, name, email, phone, avatar_url, channel_id, channel_user_id, 
	metadata, label_ids, tags, is_blocked, last_contact_at, is_active, created_at, updated_at
	`
	args := []interface{}{
		contact.Name, contact.Email, contact.Phone, contact.AvatarURL, contact.Metadata, contact.LabelIDs, contact.Tags, contact.IsBlocked, contact.UpdatedAt, contact.ID,
	}

	var updateContact entity.Contact
	err := r.db.QueryRow(subCtx, query, args...).Scan(
		&updateContact.ID,
		&updateContact.TenantID,
		&updateContact.Name,
		&updateContact.Email,
		&updateContact.Phone,
		&updateContact.AvatarURL,
		&updateContact.ChannelID,
		&updateContact.ChannelUserID,
		&updateContact.Metadata,
		&updateContact.LabelIDs,
		&updateContact.Tags,
		&updateContact.IsBlocked,
		&updateContact.LastContactAt,
		&updateContact.IsActive,
		&updateContact.CreatedAt,
		&updateContact.UpdatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23505" {
			switch pgErr.ConstraintName {
			case "idx_contacts_unique_non_null_email":
				return nil, fmt.Errorf("contact with this email already exists: %w", err)
			case "idx_contacts_unique_non_null_phone":
				return nil, fmt.Errorf("contact with this phone number already exists: %w", err)
			default:
				return nil, nil
			}
		}
		return nil, fmt.Errorf("failed to update contact: %w", err)
	}

	return contact, nil
}
func (r *contactRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Contact, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `SELECT * FROM contacts WHERE id = $1 AND deleted_at IS NULL`
	args := []interface{}{id}

	var contact entity.Contact
	err := pgxscan.Get(subCtx, r.db, &contact, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("contact not found: %w", err)
		}
		return nil, fmt.Errorf("failed to find contact by ID: %w", err)
	}

	return &contact, nil
}
func (r *contactRepository) FindByChannelUserID(ctx context.Context, tenantID, channelID uuid.UUID, channelUserID string) (*entity.Contact, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `SELECT * FROM contacts WHERE tenant_id = $1 AND channel_id = $2 AND channel_user_id = $3 AND deleted_at IS NULL`
	args := []interface{}{tenantID, channelID, channelUserID}

	var contact entity.Contact
	err := pgxscan.Get(subCtx, r.db, &contact, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("contact not found: %w", err)
		}
		return nil, fmt.Errorf("failed to find contact by channel user ID: %w", err)
	}

	return &contact, nil
}
func (r *contactRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.Contact, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	qb := NewQueryBuilder("SELECT * FROM contacts")
	qb.Where("tenant_id = $? AND deleted_at IS NULL", tenantID)

	if opts.Filter != nil && opts.Filter.Search != "" {
		searchPattern := "%" + opts.Filter.Search + "%"
		qb.Where("(name ILIKE $? OR email ILIKE $? OR phone ILIKE $?)", searchPattern, searchPattern, searchPattern)
	}

	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	}

	if opts.Pagination != nil {
		qb.WithLimit(opts.Pagination.Limit)
		qb.WithOffset(opts.Pagination.GetOffset())
	}

	query, args := qb.Build()

	var contacts []*entity.Contact
	err := pgxscan.Select(subCtx, r.db, &contacts, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list contacts: %w", err)
	}
	return contacts, nil
}
func (r *contactRepository) Count(ctx context.Context, tenantID uuid.UUID, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	qb := NewQueryBuilder("SELECT COUNT(*) FROM contacts")
	qb.Where("tenant_id = $? AND deleted_at IS NULL", tenantID)

	if filter != nil && filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		qb.Where("(name ILIKE $? OR email ILIKE $? OR phone ILIKE $?)", searchPattern, searchPattern, searchPattern)
	}

	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count contacts: %w", err)
	}
	return count, nil
}

func (r *contactRepository) Delete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `UPDATE contacts SET deleted_at = NOW() WHERE id = $1`
	args := []interface{}{id}

	res, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete contact: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("contact not found: %w", err)
	}

	return nil
}
func (r *contactRepository) HardDelete(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `DELETE FROM contacts WHERE id = $1`
	args := []interface{}{id}

	res, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to hard delete contact: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("contact not found: %w", err)
	}

	return nil
}
func (r *contactRepository) Restore(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	query := `UPDATE contacts SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL`
	args := []interface{}{id}

	res, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to restore contact: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("contact not found: %w", err)
	}

	return nil
}
