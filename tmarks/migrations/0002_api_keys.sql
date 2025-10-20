-- Migration: API Keys System
-- Created: 2025-01-16

-- API Keys 表
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,               -- UUID
  user_id TEXT NOT NULL,             -- 所属用户
  key_hash TEXT NOT NULL UNIQUE,     -- SHA256 哈希（不存储原文）
  key_prefix TEXT NOT NULL,          -- 前缀用于显示，如 "tmk_live_1a2b"
  name TEXT NOT NULL,                -- 用户自定义名称
  description TEXT,                  -- 描述（可选）
  permissions TEXT NOT NULL,         -- JSON 数组，如 '["bookmarks.create"]'
  status TEXT NOT NULL DEFAULT 'active',  -- active, revoked, expired
  expires_at TEXT,                   -- 过期时间（可选）
  last_used_at TEXT,                 -- 最后使用时间
  last_used_ip TEXT,                 -- 最后使用 IP
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_status ON api_keys(user_id, status);

-- API Key 使用日志表（简化版）
CREATE TABLE IF NOT EXISTS api_key_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,            -- API 端点，如 "/api/v1/bookmarks"
  method TEXT NOT NULL,              -- HTTP 方法，如 "POST"
  status INTEGER NOT NULL,           -- HTTP 状态码，如 200
  ip TEXT,                           -- 请求 IP
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_logs_key ON api_key_logs(api_key_id, created_at DESC);
CREATE INDEX idx_api_logs_user ON api_key_logs(user_id, created_at DESC);
