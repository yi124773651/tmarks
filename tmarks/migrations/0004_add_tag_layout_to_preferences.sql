-- Migration: Add tag layout preference
-- Created: 2025-02-14

ALTER TABLE user_preferences
ADD COLUMN tag_layout TEXT NOT NULL DEFAULT 'grid';
