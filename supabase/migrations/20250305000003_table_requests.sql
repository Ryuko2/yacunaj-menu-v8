CREATE TABLE IF NOT EXISTS table_requests (
  id          bigserial PRIMARY KEY,
  table_number integer NOT NULL,
  type        text NOT NULL CHECK (type IN ('bill', 'request')),
  message     text,
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'attended')),
  created_at  timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_table_requests_status ON table_requests(status);
CREATE INDEX IF NOT EXISTS idx_table_requests_table ON table_requests(table_number);
