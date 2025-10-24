CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_integration_id UUID REFERENCES channel_integrations(id) ON DELETE SET NULL,
    event_type VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'POST',
    payload JSONB NOT NULL,
    headers JSONB,
    response_status INTEGER NOT NULL DEFAULT 0,
    response_body JSONB,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_tenant_id ON webhook_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_channel_integration_id ON webhook_logs(channel_integration_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_response_status ON webhook_logs(response_status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at ON webhook_logs(processed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_updated_at ON webhook_logs(updated_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_deleted_at ON webhook_logs(deleted_at);

CREATE OR REPLACE FUNCTION update_webhook_logs_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_webhook_logs_modtime
BEFORE UPDATE ON webhook_logs
FOR EACH ROW
EXECUTE FUNCTION update_webhook_logs_modtime();
