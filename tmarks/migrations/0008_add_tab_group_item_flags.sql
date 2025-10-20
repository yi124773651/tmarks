-- Add is_pinned and is_todo columns to tab_group_items table
ALTER TABLE tab_group_items ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tab_group_items ADD COLUMN is_todo INTEGER NOT NULL DEFAULT 0;

-- Create index for pinned items
CREATE INDEX idx_tab_group_items_pinned ON tab_group_items(group_id, is_pinned DESC, position ASC);

