-- ============================================================================
-- Cloudflare D1 手动迁移 SQL
-- 版本: 0009 - 高级功能（颜色、标签、回收站、分享、统计）
-- ============================================================================
-- 
-- 重要提示:
-- 1. 请在 Cloudflare D1 控制台中逐条执行以下SQL
-- 2. 不要一次性粘贴所有SQL
-- 3. 如果某条SQL提示"already exists"或"duplicate column"，可以跳过
-- 4. 按照序号顺序执行
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 序列 1: 添加 color 字段到 tab_groups 表
-- 说明: 为标签页组添加颜色标记功能
-- ----------------------------------------------------------------------------
ALTER TABLE tab_groups ADD COLUMN color TEXT DEFAULT NULL;

-- ----------------------------------------------------------------------------
-- 序列 2: 添加 tags 字段到 tab_groups 表
-- 说明: 为标签页组添加标签系统（存储JSON格式的标签数组）
-- ----------------------------------------------------------------------------
ALTER TABLE tab_groups ADD COLUMN tags TEXT DEFAULT NULL;

-- ----------------------------------------------------------------------------
-- 序列 3: 添加 is_deleted 字段到 tab_groups 表
-- 说明: 实现软删除功能（0=正常，1=已删除）
-- ----------------------------------------------------------------------------
ALTER TABLE tab_groups ADD COLUMN is_deleted INTEGER DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 序列 4: 添加 deleted_at 字段到 tab_groups 表
-- 说明: 记录删除时间（用于回收站功能）
-- ----------------------------------------------------------------------------
ALTER TABLE tab_groups ADD COLUMN deleted_at TEXT DEFAULT NULL;

-- ----------------------------------------------------------------------------
-- 序列 5: 创建 shares 表
-- 说明: 创建分享功能的数据表
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 序列 6: 创建 shares 表的 token 索引
-- 说明: 优化分享链接查询性能
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(share_token);

-- ----------------------------------------------------------------------------
-- 序列 7: 创建 shares 表的 group_id 索引
-- 说明: 优化按标签页组查询分享记录的性能
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shares_group_id ON shares(group_id);

-- ----------------------------------------------------------------------------
-- 序列 8: 创建 shares 表的 user_id 索引
-- 说明: 优化按用户查询分享记录的性能
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);

-- ----------------------------------------------------------------------------
-- 序列 9: 创建 statistics 表
-- 说明: 创建统计功能的数据表
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS statistics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stat_date TEXT NOT NULL,
  groups_created INTEGER DEFAULT 0,
  groups_deleted INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_deleted INTEGER DEFAULT 0,
  shares_created INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 序列 10: 创建 statistics 表的唯一索引
-- 说明: 确保每个用户每天只有一条统计记录
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_statistics_user_date ON statistics(user_id, stat_date);

-- ----------------------------------------------------------------------------
-- 序列 11: 创建 statistics 表的 user_id 索引
-- 说明: 优化按用户查询统计数据的性能
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_statistics_user_id ON statistics(user_id);

-- ----------------------------------------------------------------------------
-- 序列 12: 创建 statistics 表的 date 索引
-- 说明: 优化按日期查询统计数据的性能
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(stat_date);

-- ----------------------------------------------------------------------------
-- 序列 13: 创建 tab_groups 的软删除索引
-- 说明: 优化查询未删除的标签页组的性能
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tab_groups_deleted ON tab_groups(user_id, is_deleted);

-- ============================================================================
-- 验证命令（执行完所有SQL后运行）
-- ============================================================================

-- 验证 1: 检查 tab_groups 表结构
-- PRAGMA table_info(tab_groups);

-- 验证 2: 检查所有表
-- SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- 验证 3: 检查 shares 表结构
-- PRAGMA table_info(shares);

-- 验证 4: 检查 statistics 表结构
-- PRAGMA table_info(statistics);

-- 验证 5: 检查索引
-- SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;

-- ============================================================================
-- 完成！
-- ============================================================================

