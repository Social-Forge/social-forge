CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_integration_id UUID REFERENCES channel_integrations(id) ON DELETE SET NULL,,
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    response_body JSONB,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_webhook_logs_status CHECK (status IN ('pending', 'processing', 'success', 'failed'))
);

CREATE INDEX idx_webhook_logs_tenant_id ON webhook_logs(tenant_id);
CREATE INDEX idx_webhook_logs_channel_integration_id ON webhook_logs(channel_integration_id);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_processed_at ON webhook_logs(processed_at);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX idx_webhook_logs_updated_at ON webhook_logs(updated_at);
CREATE INDEX idx_webhook_logs_deleted_at ON webhook_logs(deleted_at);

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
