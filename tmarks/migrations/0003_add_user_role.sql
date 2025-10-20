-- Migration: Add user role for API key quota management
-- Created: 2025-10-04

-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- Create index for role lookup
CREATE INDEX idx_users_role ON users(role);

-- Update existing users to have 'user' role (already default, but explicit for clarity)
-- To set a user as admin, run:
-- UPDATE users SET role = 'admin' WHERE username = 'your_username';
