CREATE TABLE IF NOT EXISTS ai_settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'openai',
    api_keys_encrypted TEXT,
    api_urls TEXT,
    model TEXT,
    custom_prompt TEXT,
    enable_custom_prompt INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_settings_user_id ON ai_settings(user_id);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0002');
