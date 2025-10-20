-- Migration: Create tab groups tables
-- Created: 2025-01-19
-- Description: Add support for OneTab-like tab collection feature

-- Tab groups table (containers for collected tabs)
CREATE TABLE IF NOT EXISTS tab_groups (
  id TEXT PRIMARY KEY, -- UUID
  user_id TEXT NOT NULL,
  title TEXT NOT NULL, -- Auto-generated timestamp, user can edit
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tab_groups_user_created ON tab_groups(user_id, created_at DESC);
CREATE INDEX idx_tab_groups_user_id ON tab_groups(user_id);

-- Tab group items table (individual tabs within a group)
CREATE TABLE IF NOT EXISTS tab_group_items (
  id TEXT PRIMARY KEY, -- UUID
  group_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  favicon TEXT, -- URL to favicon (e.g., Google Favicon API)
  position INTEGER NOT NULL, -- Order within the group
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES tab_groups(id) ON DELETE CASCADE
);

CREATE INDEX idx_tab_group_items_group_id ON tab_group_items(group_id, position ASC);
CREATE INDEX idx_tab_group_items_group_created ON tab_group_items(group_id, created_at ASC);

