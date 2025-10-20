-- Migration: Add advanced features (color, tags, soft delete, shares, statistics)
-- Created: 2025-10-19

-- Add new columns to tab_groups table
ALTER TABLE tab_groups ADD COLUMN color TEXT DEFAULT NULL;
ALTER TABLE tab_groups ADD COLUMN tags TEXT DEFAULT NULL; -- JSON array of tags
ALTER TABLE tab_groups ADD COLUMN is_deleted INTEGER DEFAULT 0;
ALTER TABLE tab_groups ADD COLUMN deleted_at TEXT DEFAULT NULL;

-- Create shares table for sharing tab groups
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  is_public INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  expires_at TEXT DEFAULT NULL,
  FOREIGN KEY (group_id) REFERENCES tab_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for share_token lookup
CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(share_token);
CREATE INDEX IF NOT EXISTS idx_shares_group_id ON shares(group_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);

-- Create statistics table for usage tracking
CREATE TABLE IF NOT EXISTS statistics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stat_date TEXT NOT NULL, -- YYYY-MM-DD format
  groups_created INTEGER DEFAULT 0,
  groups_deleted INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_deleted INTEGER DEFAULT 0,
  shares_created INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create unique index for user_id + stat_date
CREATE UNIQUE INDEX IF NOT EXISTS idx_statistics_user_date ON statistics(user_id, stat_date);
CREATE INDEX IF NOT EXISTS idx_statistics_user_id ON statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(stat_date);

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_tab_groups_deleted ON tab_groups(user_id, is_deleted);

