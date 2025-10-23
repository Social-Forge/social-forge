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

type ContactRepository interface {
	BaseRepository
	Create(ctx context.Context, contact *entity.Contact) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Contact, error)
	FindByChannelUserID(ctx context.Context, tenantID, channelID uuid.UUID, channelUserID string) (*entity.Contact, error)
	Search(ctx context.Context, opts *ListOptions) ([]*entity.Contact, int64, error)
	Count(ctx context.Context, filter *Filter) (int64, error)
	Update(ctx context.Context, contact *entity.Contact) (*entity.Contact, error)
	Delete(ctx context.Context, id uuid.UUID) error
	HardDelete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
	// ✅ OPTIMIZED: Queries yang leverage materialized views
	SearchFromMaterialized(ctx context.Context, tenantID uuid.UUID, searchQuery string, opts *ListOptions) ([]*entity.ContactSearch, int64, error)
	GetRecentContacts(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.RecentContact, int64, error)
	GetContactSummaries(ctx context.Context, tenantID uuid.UUID) ([]*entity.ContactSummary, error)
	GetTagAnalytics(ctx context.Context, tenantID uuid.UUID) ([]*entity.TagAnalytics, error)
	// ✅ Full-text search menggunakan tsvector
	FullTextSearch(ctx context.Context, tenantID uuid.UUID, query string, opts *ListOptions) ([]*entity.Contact, int64, error)
	// ✅ Materialized View Management
	RefreshContactViews(ctx context.Context) error
	RefreshContactSummaries(ctx context.Context) error
	RefreshContactSearch(ctx context.Context) error
	RefreshRecentContacts(ctx context.Context) error
	RefreshTagAnalytics(ctx context.Context) error
	RefreshAllContactViews(ctx context.Context) map[string]error
	GetContactViewStatus(ctx context.Context) (map[string]interface{}, error)
	// ✅ Specialized methods
	UpdateLastContact(ctx context.Context, id uuid.UUID) error
	FindDuplicates(ctx context.Context, tenantID uuid.UUID, email, phone string) ([]*entity.Contact, error)
	BulkUpdateTags(ctx context.Context, contactIDs []uuid.UUID, tags []string) error
	BulkUpdateTagsUnnest(ctx context.Context, contactIDs []uuid.UUID, tags []string) error
	BulkAppendTags(ctx context.Context, contactIDs []uuid.UUID, newTags []string) error
	BulkRemoveTags(ctx context.Context, contactIDs []uuid.UUID, tags []string) error
	BulkUpdateTagsAdvanced(ctx context.Context, contactIDs []uuid.UUID, updateType string, tags []string) error
	BulkUpdateTagsChunked(ctx context.Context, contactIDs []uuid.UUID, tags []string, chunkSize int) error
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
func (r *contactRepository) Search(ctx context.Context, opts *ListOptions) ([]*entity.Contact, int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	totalRows, err := r.Count(ctx, opts.Filter)
	if err != nil {
		return nil, 0, err
	}

	qb := r.buildBaseQuery("SELECT * FROM contacts", opts.Filter)

	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	}
	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}
	query, args := qb.Build()

	var contacts []*entity.Contact
	err = pgxscan.Select(subCtx, r.db, &contacts, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list contacts: %w", err)
	}
	return contacts, totalRows, nil
}
func (r *contactRepository) Count(ctx context.Context, filter *Filter) (int64, error) {
	subCtx, cancel := contextpool.WithTimeoutIfNone(ctx, 15)
	defer cancel()

	qb := r.buildBaseQuery("SELECT COUNT(*) FROM contacts", filter)
	query, args := qb.Build()

	var count int64
	err := r.db.QueryRow(subCtx, query, args...).Scan(&count)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
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

// ✅ Optimized Search from Materialized View
func (r *contactRepository) SearchFromMaterialized(ctx context.Context, tenantID uuid.UUID, searchQuery string, opts *ListOptions) ([]*entity.ContactSearch, int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	// ✅ Gunakan materialized view untuk performance
	qb := NewQueryBuilder("SELECT * FROM mv_contact_search")
	qb.Where("tenant_id = $?", tenantID)

	// Full-text search menggunakan tsvector dari materialized view
	if searchQuery != "" {
		qb.Where("search_vector @@ plainto_tsquery('english', $?)", searchQuery)
	}

	// Apply additional filters
	if opts.Filter != nil {
		if opts.Filter.IsActive != nil {
			qb.Where("is_active = $?", *opts.Filter.IsActive)
		}
		if opts.Filter.ChannelID != nil {
			qb.Where("channel_id = $?", *opts.Filter.ChannelID)
		}
	}

	// Count total
	countQb := qb.Clone().ChangeBase("SELECT COUNT(*) FROM mv_contact_search")
	countQuery, countArgs := countQb.Build()
	var totalRows int64
	err := r.db.QueryRow(subCtx, countQuery, countArgs...).Scan(&totalRows)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count search results: %w", err)
	}

	// Apply ordering & pagination
	if opts.OrderBy != "" {
		qb.OrderByField(opts.OrderBy, opts.OrderDir)
	} else if searchQuery != "" {
		// Default ordering by relevance untuk search
		qb.OrderBy = "ts_rank(search_vector, plainto_tsquery('english', $?)) DESC"
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
	var results []*entity.ContactSearch
	err = pgxscan.Select(subCtx, r.db, &results, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to search contacts: %w", err)
	}

	return results, totalRows, nil
}
func (r *contactRepository) GetRecentContacts(ctx context.Context, tenantID uuid.UUID, opts *ListOptions) ([]*entity.RecentContact, int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	// ✅ Gunakan materialized view untuk recent contacts
	qb := NewQueryBuilder("SELECT * FROM mv_recent_contacts")
	qb.Where("tenant_id = $?", tenantID)

	// Count total
	countQb := qb.Clone().ChangeBase("SELECT COUNT(*) FROM mv_recent_contacts")
	countQuery, countArgs := countQb.Build()
	var totalRows int64
	err := r.db.QueryRow(subCtx, countQuery, countArgs...).Scan(&totalRows)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count recent contacts: %w", err)
	}

	// Apply ordering & pagination
	qb.OrderByField("last_contact_at", "DESC")

	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}

	query, args := qb.Build()
	var recentContacts []*entity.RecentContact
	err = pgxscan.Select(subCtx, r.db, &recentContacts, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get recent contacts: %w", err)
	}

	return recentContacts, totalRows, nil
}
func (r *contactRepository) GetContactSummaries(ctx context.Context, tenantID uuid.UUID) ([]*entity.ContactSummary, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM mv_contact_summaries WHERE tenant_id = $1`

	var summaries []*entity.ContactSummary
	err := pgxscan.Select(subCtx, r.db, &summaries, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get contact summaries: %w", err)
	}

	return summaries, nil
}
func (r *contactRepository) GetTagAnalytics(ctx context.Context, tenantID uuid.UUID) ([]*entity.TagAnalytics, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	query := `SELECT * FROM mv_contact_tags_analytics WHERE tenant_id = $1 ORDER BY contact_count DESC`

	var analytics []*entity.TagAnalytics
	err := pgxscan.Select(subCtx, r.db, &analytics, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tag analytics: %w", err)
	}

	return analytics, nil
}
func (r *contactRepository) FullTextSearch(ctx context.Context, tenantID uuid.UUID, query string, opts *ListOptions) ([]*entity.Contact, int64, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if opts == nil {
		opts = NewListOptions()
	}

	// ✅ Direct full-text search menggunakan tsvector index
	baseQuery := `
		SELECT *, ts_rank(search_vector, plainto_tsquery('english', $1)) as rank 
		FROM contacts 
		WHERE tenant_id = $2 AND deleted_at IS NULL 
		AND search_vector @@ plainto_tsquery('english', $1)
	`

	qb := NewQueryBuilder(baseQuery)

	// Count total
	countQuery := `
		SELECT COUNT(*) FROM contacts 
		WHERE tenant_id = $1 AND deleted_at IS NULL 
		AND search_vector @@ plainto_tsquery('english', $2)
	`
	var totalRows int64
	err := r.db.QueryRow(subCtx, countQuery, tenantID, query).Scan(&totalRows)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count search results: %w", err)
	}

	// Apply pagination
	if opts.Pagination != nil && opts.Pagination.Limit > 0 {
		qb.WithLimit(opts.Pagination.Limit)
		if opts.Pagination.Page > 1 {
			qb.WithOffset(opts.Pagination.GetOffset())
		}
	}

	// Always order by relevance for search
	qb.OrderBy = "rank DESC, created_at DESC"

	finalQuery, args := qb.Build()
	// Prepend search query and tenantID to args
	args = append([]interface{}{query, tenantID}, args...)

	var contacts []*entity.Contact
	err = pgxscan.Select(subCtx, r.db, &contacts, finalQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to perform full-text search: %w", err)
	}

	return contacts, totalRows, nil
}
func (r *contactRepository) UpdateLastContact(ctx context.Context, id uuid.UUID) error {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	query := `
		UPDATE contacts 
		SET last_contact_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING last_contact_at
	`

	var lastContactAt time.Time
	err := r.db.QueryRow(subCtx, query, id).Scan(&lastContactAt)
	if err != nil {
		return fmt.Errorf("failed to update last contact time: %w", err)
	}

	return nil
}
func (r *contactRepository) FindDuplicates(ctx context.Context, tenantID uuid.UUID, email, phone string) ([]*entity.Contact, error) {
	subCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	query := `
		SELECT * FROM contacts 
		WHERE tenant_id = $1 AND deleted_at IS NULL 
		AND (email = $2 OR phone = $3)
		AND (email IS NOT NULL OR phone IS NOT NULL)
	`

	var contacts []*entity.Contact
	err := pgxscan.Select(subCtx, r.db, &contacts, query, tenantID, email, phone)
	if err != nil {
		return nil, fmt.Errorf("failed to find duplicate contacts: %w", err)
	}

	return contacts, nil
}
func (r *contactRepository) RefreshContactViews(ctx context.Context) error {
	// ✅ Refresh semua materialized views concurrently
	queries := []string{
		"REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_summaries",
		"REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_search",
		"REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_contacts",
		"REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_tags_analytics",
	}

	for _, query := range queries {
		_, err := r.db.Exec(ctx, query)
		if err != nil {
			return fmt.Errorf("failed to refresh view: %w", err)
		}
	}

	return nil
}
func (r *contactRepository) RefreshContactSummaries(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_summaries")
	if err != nil {
		return fmt.Errorf("failed to refresh contact summaries: %w", err)
	}
	return nil
}
func (r *contactRepository) RefreshContactSearch(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_search")
	if err != nil {
		return fmt.Errorf("failed to refresh contact search: %w", err)
	}
	return nil
}
func (r *contactRepository) RefreshRecentContacts(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_contacts")
	if err != nil {
		return fmt.Errorf("failed to refresh recent contacts: %w", err)
	}
	return nil
}
func (r *contactRepository) RefreshTagAnalytics(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_tags_analytics")
	if err != nil {
		return fmt.Errorf("failed to refresh tag analytics: %w", err)
	}
	return nil
}
func (r *contactRepository) RefreshAllContactViews(ctx context.Context) map[string]error {
	views := map[string]string{
		"contact_summaries": "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_summaries",
		"contact_search":    "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_search",
		"recent_contacts":   "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_contacts",
		"tag_analytics":     "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_contact_tags_analytics",
	}

	results := make(map[string]error)

	for name, query := range views {
		_, err := r.db.Exec(ctx, query)
		results[name] = err
		time.Sleep(100 * time.Millisecond) // Reduce load
	}

	return results
}
func (r *contactRepository) GetContactViewStatus(ctx context.Context) (map[string]interface{}, error) {
	query := `
		SELECT 
			matviewname,
			ispopulated,
			last_refresh
		FROM pg_matviews 
		WHERE matviewname IN (
			'mv_contact_summaries',
			'mv_contact_search', 
			'mv_recent_contacts',
			'mv_contact_tags_analytics'
		)
	`

	type ViewStatus struct {
		ViewName    string    `db:"matviewname"`
		IsPopulated bool      `db:"ispopulated"`
		LastRefresh time.Time `db:"last_refresh"`
	}

	var statuses []ViewStatus
	err := pgxscan.Select(ctx, r.db, &statuses, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get contact view status: %w", err)
	}

	result := make(map[string]interface{})
	for _, status := range statuses {
		result[status.ViewName] = map[string]interface{}{
			"is_populated": status.IsPopulated,
			"last_refresh": status.LastRefresh,
		}
	}

	return result, nil
}

// ✅ Approach 2: Basic Bulk Update Tags
func (r *contactRepository) BulkUpdateTags(ctx context.Context, contactIDs []uuid.UUID, tags []string) error {
	subCtx, cancel := context.WithTimeout(ctx, 30*time.Second) // Longer timeout for bulk operations
	defer cancel()

	// ✅ Gunakan transaction untuk atomic operation
	return r.WithTransaction(subCtx, func(tx pgx.Tx) error {
		// Approach 1: Update individual contacts dalam batch
		batch := &pgx.Batch{}

		for _, contactID := range contactIDs {
			query := `
				UPDATE contacts 
				SET tags = $1, updated_at = NOW()
				WHERE id = $2 AND deleted_at IS NULL
			`
			batch.Queue(query, tags, contactID)
		}

		// Execute batch
		results := tx.SendBatch(subCtx, batch)
		defer results.Close()

		// Check untuk errors
		for range contactIDs {
			_, err := results.Exec()
			if err != nil {
				return fmt.Errorf("failed to update tags for contact: %w", err)
			}
		}

		return nil
	})
}

// ✅ Approach 2: Menggunakan UNNEST untuk lebih efficient (Recommended untuk large batches)
func (r *contactRepository) BulkUpdateTagsUnnest(ctx context.Context, contactIDs []uuid.UUID, tags []string) error {
	subCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if len(contactIDs) == 0 {
		return nil // Nothing to update
	}

	query := `
		UPDATE contacts 
		SET tags = $1, updated_at = NOW()
		WHERE id = ANY($2) AND deleted_at IS NULL
	`

	result, err := r.db.Exec(subCtx, query, tags, contactIDs)
	if err != nil {
		return fmt.Errorf("failed to bulk update tags: %w", err)
	}

	if result.RowsAffected() != int64(len(contactIDs)) {
		return fmt.Errorf("some contacts were not updated, expected %d, got %d",
			len(contactIDs), result.RowsAffected())
	}

	return nil
}

// ✅ Approach 3: Append tags (bukan replace)
func (r *contactRepository) BulkAppendTags(ctx context.Context, contactIDs []uuid.UUID, newTags []string) error {
	subCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if len(contactIDs) == 0 {
		return nil
	}

	query := `
		UPDATE contacts 
		SET tags = ARRAY(
			SELECT DISTINCT UNNEST(tags || $1)
			WHERE UNNEST(tags || $1) IS NOT NULL
		), 
		updated_at = NOW()
		WHERE id = ANY($2) AND deleted_at IS NULL
	`

	result, err := r.db.Exec(subCtx, query, newTags, contactIDs)
	if err != nil {
		return fmt.Errorf("failed to bulk append tags: %w", err)
	}

	fmt.Printf("Successfully appended tags to %d contacts\n", result.RowsAffected())
	return nil
}

// ✅ Approach 4: Remove specific tags
func (r *contactRepository) BulkRemoveTags(ctx context.Context, contactIDs []uuid.UUID, tagsToRemove []string) error {
	subCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if len(contactIDs) == 0 {
		return nil
	}

	query := `
		UPDATE contacts 
		SET tags = ARRAY(
			SELECT tag FROM UNNEST(tags) AS t(tag)
			WHERE tag != ALL($1)
		), 
		updated_at = NOW()
		WHERE id = ANY($2) AND deleted_at IS NULL
	`

	result, err := r.db.Exec(subCtx, query, tagsToRemove, contactIDs)
	if err != nil {
		return fmt.Errorf("failed to bulk remove tags: %w", err)
	}

	fmt.Printf("Successfully removed tags from %d contacts\n", result.RowsAffected())
	return nil
}

// ✅ BulkUpdateTags dengan different update strategies
func (r *contactRepository) BulkUpdateTagsAdvanced(ctx context.Context, contactIDs []uuid.UUID, updateType string, tags []string) error {
	subCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if len(contactIDs) == 0 {
		return nil
	}

	var query string
	var args []interface{}

	switch updateType {
	case "replace":
		// Replace all existing tags dengan new ones
		query = `UPDATE contacts SET tags = $1, updated_at = NOW() WHERE id = ANY($2) AND deleted_at IS NULL`
		args = []interface{}{tags, contactIDs}

	case "append":
		// Append new tags to existing ones (no duplicates)
		query = `
			UPDATE contacts 
			SET tags = ARRAY(
				SELECT DISTINCT UNNEST(tags || $1)
				WHERE UNNEST(tags || $1) IS NOT NULL
			), 
			updated_at = NOW()
			WHERE id = ANY($2) AND deleted_at IS NULL
		`
		args = []interface{}{tags, contactIDs}

	case "remove":
		// Remove specific tags
		query = `
			UPDATE contacts 
			SET tags = ARRAY(
				SELECT tag FROM UNNEST(tags) AS t(tag)
				WHERE tag != ALL($1)
			), 
			updated_at = NOW()
			WHERE id = ANY($2) AND deleted_at IS NULL
		`
		args = []interface{}{tags, contactIDs}

	case "toggle":
		// Toggle tags - remove if exists, add if not exists
		query = `
			UPDATE contacts 
			SET tags = CASE 
				WHEN $1 && tags THEN 
					ARRAY(SELECT tag FROM UNNEST(tags) AS t(tag) WHERE tag != ALL($1))
				ELSE 
					ARRAY(SELECT DISTINCT UNNEST(tags || $1) WHERE UNNEST(tags || $1) IS NOT NULL)
			END,
			updated_at = NOW()
			WHERE id = ANY($2) AND deleted_at IS NULL
		`
		args = []interface{}{tags, contactIDs}

	default:
		return fmt.Errorf("invalid update type: %s", updateType)
	}

	result, err := r.db.Exec(subCtx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to bulk update tags with strategy '%s': %w", updateType, err)
	}

	fmt.Printf("Successfully updated tags for %d contacts using strategy '%s'\n",
		result.RowsAffected(), updateType)
	return nil
}

// ✅ Untuk very large datasets, process dalam chunks
func (r *contactRepository) BulkUpdateTagsChunked(ctx context.Context, contactIDs []uuid.UUID, tags []string, chunkSize int) error {
	subCtx, cancel := context.WithTimeout(ctx, 2*time.Minute) // Longer timeout for large operations
	defer cancel()

	if len(contactIDs) == 0 {
		return nil
	}

	// Process dalam chunks untuk avoid memory issues dan timeouts
	for i := 0; i < len(contactIDs); i += chunkSize {
		end := i + chunkSize
		if end > len(contactIDs) {
			end = len(contactIDs)
		}

		chunk := contactIDs[i:end]

		err := r.BulkUpdateTagsUnnest(subCtx, chunk, tags)
		if err != nil {
			return fmt.Errorf("failed to update tags for chunk %d-%d: %w", i, end, err)
		}

		fmt.Printf("Processed chunk %d-%d of %d contacts\n", i, end, len(contactIDs))

		// Small delay antara chunks untuk reduce database load
		time.Sleep(100 * time.Millisecond)
	}

	return nil
}

// ✅ Helper Query Builder
func (r *contactRepository) buildBaseQuery(baseQuery string, filter *Filter) *QueryBuilder {
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

	if filter.ChannelID != nil {
		qb.Where("channel_id = $?", *filter.ChannelID)
	}

	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		qb.Where("(name ILIKE $? OR email ILIKE $?)", searchPattern, searchPattern)
	}
	if filter.IsActive != nil {
		qb.Where("is_active = $?", *filter.IsActive)
	}
	if filter.Extra != nil {
		for key, value := range filter.Extra {
			if !isValidColumnName(key) {
				continue // Skip invalid keys
			}
			qb.Where(key+" = $?", value)
		}
	}

	return qb
}
