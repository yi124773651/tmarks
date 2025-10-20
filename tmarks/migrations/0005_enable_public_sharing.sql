-- Migration: Enable public sharing support
-- Adds public sharing flags and metadata for users and bookmarks

PRAGMA foreign_keys=OFF;

-- Bookmarks: mark whether a bookmark is public
ALTER TABLE bookmarks ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0;

-- Users: public sharing configuration
ALTER TABLE users ADD COLUMN public_share_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN public_slug TEXT;
ALTER TABLE users ADD COLUMN public_page_title TEXT;
ALTER TABLE users ADD COLUMN public_page_description TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_slug
  ON users(public_slug)
  WHERE public_slug IS NOT NULL;

PRAGMA foreign_keys=ON;
