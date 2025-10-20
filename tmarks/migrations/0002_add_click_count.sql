-- 添加书签点击次数统计
-- Migration: 0002_add_click_count.sql

-- 为 bookmarks 表添加点击次数字段
ALTER TABLE bookmarks ADD COLUMN click_count INTEGER NOT NULL DEFAULT 0;

-- 添加最后点击时间字段
ALTER TABLE bookmarks ADD COLUMN last_clicked_at TEXT;

-- 为点击次数排序创建索引
CREATE INDEX idx_bookmarks_click_count ON bookmarks(user_id, click_count DESC);

-- 为最后点击时间创建索引
CREATE INDEX idx_bookmarks_last_clicked ON bookmarks(user_id, last_clicked_at DESC);