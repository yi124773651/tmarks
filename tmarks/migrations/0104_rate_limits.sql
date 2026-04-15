CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  window_seconds INTEGER NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (key, window_seconds, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at ON rate_limits(updated_at);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0104');

