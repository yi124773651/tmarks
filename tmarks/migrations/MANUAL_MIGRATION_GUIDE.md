# Cloudflare D1 手动迁移指南

本指南用于在Cloudflare D1控制台手动执行数据库迁移。

## 📋 执行步骤

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **D1** → 选择 `tmarks-prod-db` 数据库
3. 点击 **Console** 标签
4. **逐条复制粘贴**下面的SQL语句并执行
5. 每条执行后检查是否成功（应该显示绿色的成功提示）

## ⚠️ 重要提示

- **必须逐条执行**，不要一次性粘贴所有SQL
- 如果某条SQL提示"already exists"或"duplicate column"，说明该字段/表已存在，可以跳过
- 按照序号顺序执行

---

## 🔢 SQL执行序列

### 序列 1: 添加 color 字段到 tab_groups 表

```sql
ALTER TABLE tab_groups ADD COLUMN color TEXT DEFAULT NULL;
```

**说明**: 为标签页组添加颜色标记功能

---

### 序列 2: 添加 tags 字段到 tab_groups 表

```sql
ALTER TABLE tab_groups ADD COLUMN tags TEXT DEFAULT NULL;
```

**说明**: 为标签页组添加标签系统（存储JSON格式的标签数组）

---

### 序列 3: 添加 is_deleted 字段到 tab_groups 表

```sql
ALTER TABLE tab_groups ADD COLUMN is_deleted INTEGER DEFAULT 0;
```

**说明**: 实现软删除功能（0=正常，1=已删除）

---

### 序列 4: 添加 deleted_at 字段到 tab_groups 表

```sql
ALTER TABLE tab_groups ADD COLUMN deleted_at TEXT DEFAULT NULL;
```

**说明**: 记录删除时间（用于回收站功能）

---

### 序列 5: 创建 shares 表

```sql
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
```

**说明**: 创建分享功能的数据表

---

### 序列 6: 创建 shares 表的 token 索引

```sql
CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(share_token);
```

**说明**: 优化分享链接查询性能

---

### 序列 7: 创建 shares 表的 group_id 索引

```sql
CREATE INDEX IF NOT EXISTS idx_shares_group_id ON shares(group_id);
```

**说明**: 优化按标签页组查询分享记录的性能

---

### 序列 8: 创建 shares 表的 user_id 索引

```sql
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
```

**说明**: 优化按用户查询分享记录的性能

---

### 序列 9: 创建 statistics 表

```sql
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
```

**说明**: 创建统计功能的数据表

---

### 序列 10: 创建 statistics 表的唯一索引

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_statistics_user_date ON statistics(user_id, stat_date);
```

**说明**: 确保每个用户每天只有一条统计记录

---

### 序列 11: 创建 statistics 表的 user_id 索引

```sql
CREATE INDEX IF NOT EXISTS idx_statistics_user_id ON statistics(user_id);
```

**说明**: 优化按用户查询统计数据的性能

---

### 序列 12: 创建 statistics 表的 date 索引

```sql
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(stat_date);
```

**说明**: 优化按日期查询统计数据的性能

---

### 序列 13: 创建 tab_groups 的软删除索引

```sql
CREATE INDEX IF NOT EXISTS idx_tab_groups_deleted ON tab_groups(user_id, is_deleted);
```

**说明**: 优化查询未删除的标签页组的性能

---

## ✅ 验证迁移结果

执行完所有SQL后，运行以下验证命令：

### 验证 1: 检查 tab_groups 表结构

```sql
PRAGMA table_info(tab_groups);
```

**预期结果**: 应该能看到以下字段：
- `id`
- `user_id`
- `title`
- `created_at`
- `updated_at`
- `color` ✨ 新增
- `tags` ✨ 新增
- `is_deleted` ✨ 新增
- `deleted_at` ✨ 新增

---

### 验证 2: 检查所有表

```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

**预期结果**: 应该能看到以下表：
- `users`
- `bookmarks`
- `tags`
- `api_keys`
- `preferences`
- `tab_groups`
- `tab_group_items`
- `shares` ✨ 新增
- `statistics` ✨ 新增

---

### 验证 3: 检查 shares 表结构

```sql
PRAGMA table_info(shares);
```

**预期结果**: 应该能看到所有shares表的字段

---

### 验证 4: 检查 statistics 表结构

```sql
PRAGMA table_info(statistics);
```

**预期结果**: 应该能看到所有statistics表的字段

---

### 验证 5: 检查索引

```sql
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;
```

**预期结果**: 应该能看到所有新创建的索引

---

## 🎉 完成

如果所有验证都通过，说明迁移成功！现在可以使用以下新功能：

1. ✅ **颜色标记** - 为标签页组设置颜色
2. ✅ **标签系统** - 为标签页组添加标签
3. ✅ **回收站** - 软删除和恢复标签页组
4. ✅ **分享功能** - 生成分享链接
5. ✅ **使用统计** - 查看使用数据和趋势
6. ✅ **自定义排序** - 按时间/标题/数量排序

---

## 🐛 故障排除

### 问题 1: "duplicate column name"

**原因**: 字段已经存在  
**解决**: 跳过该SQL，继续执行下一条

### 问题 2: "table shares already exists"

**原因**: 表已经存在  
**解决**: 跳过该SQL，继续执行下一条

### 问题 3: "index already exists"

**原因**: 索引已经存在  
**解决**: 跳过该SQL，继续执行下一条

### 问题 4: "foreign key constraint failed"

**原因**: 引用的表不存在  
**解决**: 确保按顺序执行SQL，先创建表再创建索引

---

## 📞 需要帮助？

如果遇到其他问题，请提供：
1. 具体的错误信息
2. 执行到哪一个序列
3. 验证命令的输出结果

