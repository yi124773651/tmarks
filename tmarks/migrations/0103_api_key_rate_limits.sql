CREATE TABLE IF NOT EXISTS api_key_rate_limits (
  api_key_id TEXT NOT NULL,
  window TEXT NOT NULL, -- minute|hour|day
  window_start INTEGER NOT NULL, -- unix ms aligned to window
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (api_key_id, window, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_key_rate_limits_updated_at ON api_key_rate_limits(updated_at);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0103');

