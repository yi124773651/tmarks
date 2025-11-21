-- ============================================================================
-- 网页快照功能
-- 版本: 0004
-- 说明: 添加网页快照存储和管理功能
-- ============================================================================

-- 快照表：存储网页快照的元数据
CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  bookmark_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  snapshot_title TEXT NOT NULL,
  is_latest INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
);

-- 索引：按书签 ID 查询快照
CREATE INDEX IF NOT EXISTS idx_snapshots_bookmark_id ON snapshots(bookmark_id);

-- 索引：按创建时间排序
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots(created_at DESC);

-- 索引：按内容哈希查询（用于去重）
CREATE INDEX IF NOT EXISTS idx_snapshots_content_hash ON snapshots(content_hash);

-- 索引：查询最新快照
CREATE INDEX IF NOT EXISTS idx_snapshots_bookmark_latest ON snapshots(bookmark_id, is_latest DESC);

-- 索引：按版本号排序
CREATE INDEX IF NOT EXISTS idx_snapshots_bookmark_version ON snapshots(bookmark_id, version DESC);

-- 书签表：添加快照相关字段
ALTER TABLE bookmarks ADD COLUMN has_snapshot INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookmarks ADD COLUMN latest_snapshot_at TEXT;
ALTER TABLE bookmarks ADD COLUMN snapshot_count INTEGER NOT NULL DEFAULT 0;

-- 索引：按快照状态筛选书签
CREATE INDEX IF NOT EXISTS idx_bookmarks_has_snapshot ON bookmarks(user_id, has_snapshot, created_at DESC);

-- 用户偏好设置：添加快照相关配置
ALTER TABLE user_preferences ADD COLUMN snapshot_retention_count INTEGER NOT NULL DEFAULT 5;
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_create INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_dedupe INTEGER NOT NULL DEFAULT 1;
ALTER TABLE user_preferences ADD COLUMN snapshot_auto_cleanup_days INTEGER NOT NULL DEFAULT 0;

-- 记录迁移版本
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0004');

-- ============================================================================
-- 说明
-- ============================================================================
-- 
-- snapshots 表字段说明：
-- - id: 快照唯一标识符 (UUID)
-- - bookmark_id: 关联的书签 ID
-- - version: 快照版本号（同一书签的快照按创建顺序递增）
-- - file_path: R2 存储路径 (snapshots/{bookmarkId}/{snapshotId}.html)
-- - file_size: HTML 文件大小（字节）
-- - content_hash: 内容 SHA-256 哈希（用于去重）
-- - snapshot_title: 快照标题（通常是网页标题）
-- - is_latest: 是否为最新版本（0 或 1）
-- - created_at: 创建时间
--
-- bookmarks 表新增字段说明：
-- - has_snapshot: 是否有快照（0 或 1）
-- - latest_snapshot_at: 最新快照创建时间
-- - snapshot_count: 快照总数
--
-- user_preferences 表新增字段说明：
-- - snapshot_retention_count: 每个书签保留的快照数量（默认 5）
-- - snapshot_auto_create: 是否自动创建快照（0 或 1，默认 0）
-- - snapshot_auto_dedupe: 是否自动去重（0 或 1，默认 1）
-- - snapshot_auto_cleanup_days: 自动清理天数（0 表示不限制）
--
-- ============================================================================
