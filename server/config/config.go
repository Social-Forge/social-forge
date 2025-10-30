package config

import (
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

var (
	Logger             *zap.Logger
	loggerOnce         sync.Once
	fallbackLogger     = zap.NewExample()
	loggerMu           sync.Mutex // Untuk thread-safe Close
	PGXDB              *Database
	dbMutex            sync.Mutex
	slowQueryThreshold = 500 * time.Millisecond
)

type Config struct {
	App        AppConfig
	Database   DatabaseConfig
	Redis      RedisConfig
	JWT        JWTConfig
	Centrifugo CentrifugoConfig
	MinIO      MinIOConfig
	Asynq      AsynqConfig
	Meta       MetaConfig
	Telegram   TelegramConfig
	AI         AIConfig
	Email      EmailConfig
}
type AppConfig struct {
	Name          string
	Env           string
	Debug         bool
	Port          string
	URL           string
	LogLevel      string
	LogFormat     string
	LogFilePath   string
	EncryptionKey string
	ClientOrigin  string
}

type DatabaseConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
	PoolSize int
	Instance string
}
type JWTConfig struct {
	Secret             string
	ExpireHours        int
	RefreshExpireHours int
}
type CentrifugoConfig struct {
	URL         string
	APIKey      string
	TokenSecret string
}
type MinIOConfig struct {
	Endpoint   string
	AccessKey  string
	SecretKey  string
	UseSSL     bool
	BucketName string
	PublicURL  string
}
type AsynqConfig struct {
	RedisAddr     string
	RedisPassword string
	Concurrency   int
	DB            int
}
type MetaConfig struct {
	AppID              string
	AppSecret          string
	WebhookVerifyToken string
	GraphAPIVersion    string
}
type TelegramConfig struct {
	BotToken string
	ChatID   string
}
type AIConfig struct {
	OpenAIKey      string
	OpenAIModel    string
	AnthropicKey   string
	AnthropicModel string
	GeminiKey      string
	GeminiProject  string
	GeminiModel    string
}
type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	FromName     string
	FromAddress  string
}

func Load() (*Config, error) {
	// Load .env file if exists
	if err := godotenv.Load(); err != nil {
		fmt.Println("No .env file found, using environment variables")
	}

	viper.AutomaticEnv()

	config := &Config{
		App: AppConfig{
			Name:          getEnv("APP_NAME", "SocialForge"),
			Env:           getEnv("APP_ENV", "development"),
			Debug:         getEnv("APP_DEBUG", "true") == "true",
			Port:          getEnv("APP_PORT", "8080"),
			URL:           getEnv("APP_URL", "http://localhost:8080"),
			LogLevel:      getEnv("LOG_LEVEL", "debug"),
			LogFormat:     getEnv("LOG_FORMAT", "json"),
			LogFilePath:   getEnv("LOG_FILE_PATH", "./logs/app.log"),
			EncryptionKey: getEnv("ENCRYPTION_KEY", "socialforge123"),
			ClientOrigin:  getEnv("CLIENT_ORIGIN", "https://socialforge.io"),
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnv("DB_PORT", "5432"),
			User:            getEnv("DB_USER", "socialforge"),
			Password:        getEnv("DB_PASSWORD", "socialforge123"),
			Name:            getEnv("DB_NAME", "socialforge_db"),
			SSLMode:         getEnv("DB_SSL_MODE", "disable"),
			MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 5),
			ConnMaxLifetime: time.Duration(getEnvAsInt("DB_CONN_MAX_LIFETIME", 300)) * time.Second,
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
			PoolSize: getEnvAsInt("REDIS_POOL_SIZE", 10),
			Instance: getEnv("REDIS_INSTANCE", "socialforge1"),
		},
		JWT: JWTConfig{
			Secret:             getEnv("JWT_SECRET", "your-secret-key"),
			ExpireHours:        getEnvAsInt("JWT_EXPIRE_HOURS", 24),
			RefreshExpireHours: getEnvAsInt("JWT_REFRESH_EXPIRE_HOURS", 168),
		},
		Centrifugo: CentrifugoConfig{
			URL:         getEnv("CENTRIFUGO_URL", "http://localhost:8000"),
			APIKey:      getEnv("CENTRIFUGO_API_KEY", ""),
			TokenSecret: getEnv("CENTRIFUGO_TOKEN_SECRET", ""),
		},
		MinIO: MinIOConfig{
			Endpoint:   getEnv("MINIO_ENDPOINT", "localhost:9000"),
			AccessKey:  getEnv("MINIO_ROOT_USER", "minioadmin"),
			SecretKey:  getEnv("MINIO_ROOT_PASSWORD", "minioadmin123"),
			UseSSL:     getEnv("MINIO_USE_SSL", "false") == "true",
			BucketName: getEnv("MINIO_BUCKET_NAME", "socialforge"),
			PublicURL:  getEnv("MINIO_PUBLIC_URL", "http://localhost:9000"),
		},
		Asynq: AsynqConfig{
			RedisAddr:     fmt.Sprintf("%s:%s", getEnv("REDIS_HOST", "localhost"), getEnv("REDIS_PORT", "6379")),
			RedisPassword: getEnv("REDIS_PASSWORD", ""),
			Concurrency:   getEnvAsInt("ASYNQ_CONCURRENCY", 10),
			DB:            getEnvAsInt("ASYNQ_DB", 1),
		},
		Meta: MetaConfig{
			AppID:              getEnv("META_APP_ID", ""),
			AppSecret:          getEnv("META_APP_SECRET", ""),
			WebhookVerifyToken: getEnv("META_WEBHOOK_VERIFY_TOKEN", ""),
			GraphAPIVersion:    getEnv("META_GRAPH_API_VERSION", "v18.0"),
		},
		Telegram: TelegramConfig{
			BotToken: getEnv("TELEGRAM_BOT_TOKEN", ""),
			ChatID:   getEnv("TELEGRAM_CHAT_ID", ""),
		},
		AI: AIConfig{
			OpenAIKey:      getEnv("OPENAI_API_KEY", ""),
			OpenAIModel:    getEnv("OPENAI_MODEL", "gpt-4-turbo-preview"),
			AnthropicKey:   getEnv("ANTHROPIC_API_KEY", ""),
			AnthropicModel: getEnv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229"),
			GeminiKey:      getEnv("GEMINI_API_KEY", ""),
			GeminiProject:  getEnv("GEMINI_PROJECT_ID", ""),
			GeminiModel:    getEnv("GEMINI_MODEL", "gemini-1.5-pro-latest"),
		},
		Email: EmailConfig{
			SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
			SMTPPort:     getEnv("SMTP_PORT", "587"),
			SMTPUsername: getEnv("SMTP_USERNAME", ""),
			SMTPPassword: getEnv("SMTP_PASSWORD", ""),
			FromName:     getEnv("SMTP_FROM_NAME", "Social Forge"),
			FromAddress:  getEnv("SMTP_FROM_ADDRESS", "noreply@socialforge.com"),
		},
	}

	return config, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	var value int
	fmt.Sscanf(valueStr, "%d", &value)
	return value
}

func (c *DatabaseConfig) GetDSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		c.User, c.Password, c.Host, c.Port, c.Name, c.SSLMode,
	)
}

func (c *RedisConfig) GetAddr() string {
	return fmt.Sprintf("%s:%s", c.Host, c.Port)
}
func (c *RedisConfig) GetInstance() string {
	return c.Instance
}

func (c *AppConfig) IsDevelopment() bool {
	return c.Env == "development"
}

func (c *AppConfig) IsProduction() bool {
	return c.Env == "production"
}
func (c *AppConfig) IsDebug() bool {
	return c.Debug
}
