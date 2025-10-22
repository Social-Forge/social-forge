CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_message_reads_user_id_message_id UNIQUE (user_id, message_id)
);

CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX idx_message_reads_user_id ON message_reads(user_id);
CREATE INDEX idx_message_reads_read_at ON message_reads(read_at);
CREATE INDEX idx_message_reads_created_at ON message_reads(created_at);
CREATE INDEX idx_message_reads_updated_at ON message_reads(updated_at);
CREATE INDEX idx_message_reads_deleted_at ON message_reads(deleted_at);

CREATE TRIGGER update_message_reads_modtime
BEFORE UPDATE ON message_reads
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();