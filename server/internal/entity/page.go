package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Page struct {
	ID                       uuid.UUID      `json:"id" db:"id"`
	TenantID                 uuid.UUID      `json:"tenant_id" db:"tenant_id" validate:"required"`
	DivisionID               *uuid.UUID     `json:"division_id,omitempty" db:"division_id"`
	Title                    string         `json:"title" db:"title" validate:"required,max=255"`
	Slug                     string         `json:"slug" db:"slug" validate:"required,max=100"`
	Description              *string        `json:"description,omitempty" db:"description"`
	Content                  *string        `json:"content,omitempty" db:"content" validate:"required"`
	Status                   string         `json:"status" db:"status" validate:"required,oneof=published draft archived"`
	MetaTitle                *string        `json:"meta_title,omitempty" db:"meta_title"`
	MetaDescription          *string        `json:"meta_description,omitempty" db:"meta_description"`
	MetaKeywords             pq.StringArray `json:"meta_keywords,omitempty" db:"meta_keywords"`
	MetaImageURL             *string        `json:"meta_image_url,omitempty" db:"meta_image_url"`
	MetaOGTitle              *string        `json:"meta_og_title,omitempty" db:"meta_og_title"`
	MetaOGDescription        *string        `json:"meta_og_description,omitempty" db:"meta_og_description"`
	MetaOGImageURL           *string        `json:"meta_og_image_url,omitempty" db:"meta_og_image_url"`
	MetaOGType               *string        `json:"meta_og_type,omitempty" db:"meta_og_type"`
	MetaOGURL                *string        `json:"meta_og_url,omitempty" db:"meta_og_url"`
	MetaOGSiteName           *string        `json:"meta_og_site_name,omitempty" db:"meta_og_site_name"`
	MetaTwitterCard          *string        `json:"meta_twitter_card,omitempty" db:"meta_twitter_card"`
	MetaTwitterTitle         *string        `json:"meta_twitter_title,omitempty" db:"meta_twitter_title"`
	MetaTwitterDescription   *string        `json:"meta_twitter_description,omitempty" db:"meta_twitter_description"`
	MetaTwitterImageURL      *string        `json:"meta_twitter_image_url,omitempty" db:"meta_twitter_image_url"`
	MetaArticlePublishedTime *time.Time     `json:"meta_article_published_time,omitempty" db:"meta_article_published_time"`
	MetaArticleModifiedTime  *time.Time     `json:"meta_article_modified_time,omitempty" db:"meta_article_modified_time"`
	MetaArticleAuthor        *string        `json:"meta_article_author,omitempty" db:"meta_article_author"`
	MetaArticleSection       *string        `json:"meta_article_section,omitempty" db:"meta_article_section"`
	MetaArticleTags          pq.StringArray `json:"meta_article_tags,omitempty" db:"meta_article_tags"`
	Template                 *string        `json:"template,omitempty" db:"template"`
	ThemeConfig              *ThemeConfig   `json:"theme_config,omitempty" db:"theme_config"`
	IsPublished              bool           `json:"is_published" db:"is_published"`
	PublishedAt              *time.Time     `json:"published_at,omitempty" db:"published_at"`
	ViewCount                int            `json:"view_count" db:"view_count"`
	FeaturedImageURL         *string        `json:"featured_image_url,omitempty" db:"featured_image_url"`
	ReadingTimeMinutes       int            `json:"reading_time_minutes" db:"reading_time_minutes"`
	SearchVector             string         `json:"search_vector,omitempty" db:"search_vector"`
	CreatedAt                time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt                time.Time      `json:"updated_at" db:"updated_at"`
	DeletedAt                *time.Time     `json:"deleted_at,omitempty" db:"deleted_at"`
}

type ThemeConfig map[string]interface{}

func (tc ThemeConfig) Value() (driver.Value, error) {
	if tc == nil {
		return nil, nil
	}
	return json.Marshal(tc)
}

func (tc *ThemeConfig) Scan(value interface{}) error {
	if value == nil {
		*tc = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, tc)
}

func (Page) TableName() string {
	return "pages"
}

func (p *Page) Publish() {
	now := time.Now()
	p.IsPublished = true
	p.PublishedAt = &now
}

func (p *Page) IncrementViews() {
	p.ViewCount++
}
