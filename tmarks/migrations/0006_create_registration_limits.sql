-- Migration: Track daily registration counts
-- Creates a table to store per-day registration totals for rate limiting

CREATE TABLE IF NOT EXISTS registration_limits (
  date TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
