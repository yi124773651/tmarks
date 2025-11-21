# 快照功能配置指南

快照功能需要配置 R2 存储和执行数据库迁移。

## 1. 创建 R2 存储桶

### 在 Cloudflare Dashboard 中创建

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的账户
3. 进入 **R2** 页面
4. 点击 **创建存储桶**
5. 输入存储桶名称：`tmarks-snapshots`（或其他名称）
6. 选择区域（建议选择离用户最近的区域）
7. 点击 **创建存储桶**

### 使用 Wrangler CLI 创建

```bash
# 安装 wrangler（如果还没安装）
npm install -g wrangler

# 登录
wrangler login

# 创建 R2 存储桶
wrangler r2 bucket create tmarks-snapshots
```

## 2. 配置 R2 绑定

### 在 Cloudflare Pages Dashboard 中配置

1. 进入你的 Cloudflare Pages 项目
2. 点击 **设置 (Settings)**
3. 点击 **函数 (Functions)**
4. 滚动到 **R2 存储桶绑定 (R2 bucket bindings)**
5. 点击 **添加绑定**
6. 配置：
   - **变量名 (Variable name)**: `SNAPSHOTS`
   - **R2 存储桶 (R2 bucket)**: 选择 `tmarks-snapshots`
   - **环境 (Environment)**: 选择 `Production` 和 `Preview`（如果需要）
7. 点击 **保存**

> 💡 **注意**: 我们使用 Dashboard 配置而不是 wrangler.toml，这样更安全且不会在代码中暴露资源 ID

## 3. 执行数据库迁移

### 查看迁移文件

迁移文件位于：`tmarks/migrations/add_snapshots.sql`

```sql
-- 创建快照表
CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  bookmark_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  snapshot_title TEXT NOT NULL,
  is_latest BOOLEAN DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_snapshots_bookmark_id ON snapshots(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_content_hash ON snapshots(content_hash);

-- 更新 bookmarks 表
ALTER TABLE bookmarks ADD COLUMN has_snapshot BOOLEAN DEFAULT 0;
ALTER TABLE bookmarks ADD COLUMN latest_snapshot_at TEXT;
```

### 执行迁移

#### 在 Cloudflare Dashboard 中执行（推荐）

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Workers & Pages**
3. 点击 **D1**
4. 选择你的数据库（例如 `tmarks-prod-db`）
5. 点击 **Console** 标签
6. 打开 `tmarks/migrations/add_snapshots.sql` 文件
7. 复制全部内容
8. 粘贴到 D1 控制台
9. 点击 **Execute**
10. 确认执行成功（应该显示 "Query executed successfully"）

> 💡 **提示**: 由于我们部署在 Cloudflare Pages，直接在 Dashboard 中执行 SQL 是最简单的方式

## 4. 验证配置

### 检查 R2 绑定

在你的 Functions 代码中，应该能访问 `env.SNAPSHOTS`：

```typescript
// tmarks/functions/api/v1/bookmarks/[id]/snapshots.ts
export const onRequest: PagesFunction<Env> = async (context) => {
  const { SNAPSHOTS } = context.env;
  
  // 测试 R2 连接
  console.log('R2 Bucket:', SNAPSHOTS);
  
  // ...
};
```

### 检查数据库表

在 D1 Console 中执行以下 SQL 验证：

```sql
-- 查看 snapshots 表结构
SELECT sql FROM sqlite_master WHERE type='table' AND name='snapshots';

-- 查看 bookmarks 表是否有新字段
PRAGMA table_info(bookmarks);

-- 查看 snapshots 表的索引
SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='snapshots';
```

## 5. 测试快照功能

### 创建测试快照

1. 打开浏览器扩展
2. 访问任意网页
3. 点击扩展图标
4. 勾选 **"创建快照"**
5. 点击 **"保存书签"**
6. 检查是否成功创建

### 查看快照

1. 打开 Web 应用
2. 找到刚才保存的书签
3. 应该能看到 `📸 1` 徽章
4. 点击徽章查看快照列表
5. 点击快照项在新窗口打开

### 检查 R2 存储

在 Cloudflare Dashboard 中查看：

1. 进入 **R2** 页面
2. 点击 `tmarks-snapshots` 存储桶
3. 查看 `snapshots/` 目录
4. 应该能看到按 bookmarkId 组织的快照文件

## 6. 环境变量配置（可选）

在 Cloudflare Pages Dashboard 中配置以下环境变量：

### 生产环境

- `SNAPSHOT_RETENTION_COUNT`: 每个书签保留的快照数量（默认：5）
- `SNAPSHOT_AUTO_CLEANUP`: 是否自动清理旧快照（默认：true）

配置路径：
1. 进入 Pages 项目
2. 点击 **设置 (Settings)**
3. 点击 **环境变量 (Environment variables)**
4. 选择 **生产环境 (Production)**
5. 添加变量

## 7. 常见问题

### Q: R2 绑定失败

**错误信息**: `SNAPSHOTS is not defined`

**解决方案**:
1. 确认已在 Dashboard 中配置 R2 绑定
2. 重新部署项目
3. 检查绑定的变量名是否为 `SNAPSHOTS`

### Q: 数据库迁移失败

**错误信息**: `table snapshots already exists`

**解决方案**:
- 迁移文件使用了 `IF NOT EXISTS`，不应该报错
- 如果报错，可能是部分迁移已执行
- 可以手动检查表是否存在

### Q: 快照上传失败

**错误信息**: `Failed to upload snapshot`

**可能原因**:
1. R2 绑定未配置
2. 文件太大（R2 单个文件限制 5GB）
3. 网络问题

**解决方案**:
1. 检查 R2 绑定配置
2. 检查快照文件大小
3. 查看 Functions 日志

### Q: 如何查看 Functions 日志

在 Cloudflare Dashboard 中查看：

1. 进入你的 Pages 项目
2. 点击 **部署 (Deployments)**
3. 选择最新的部署
4. 点击 **函数日志 (Functions logs)**
5. 查看实时日志输出

## 8. 成本估算

### R2 存储成本

- **存储**: $0.015/GB/月
- **Class A 操作** (写入): $4.50/百万次
- **Class B 操作** (读取): $0.36/百万次

### 示例计算

假设：
- 1000 个书签
- 每个书签 3 个快照
- 每个快照 500KB

**存储成本**:
- 总大小: 1000 × 3 × 0.5MB = 1.5GB
- 月成本: 1.5GB × $0.015 = $0.0225/月

**操作成本**:
- 创建快照: 3000 次写入 = $0.0135
- 查看快照: 假设每月 10000 次读取 = $0.0036

**总成本**: 约 $0.04/月

### 免费额度

Cloudflare R2 提供：
- 每月 10GB 免费存储
- 每月 100 万次 Class A 操作
- 每月 1000 万次 Class B 操作

对于大多数个人用户，完全在免费额度内！

## 9. 备份和恢复

### 备份 R2 数据

在 Cloudflare Dashboard 中：

1. 进入 R2 存储桶
2. 选择要备份的文件
3. 点击 **下载 (Download)**

或使用 R2 API 批量下载（需要 API Token）

### 恢复数据

通过 Dashboard 上传：

1. 进入 R2 存储桶
2. 点击 **上传 (Upload)**
3. 选择备份的 HTML 文件
4. 确保文件路径正确：`snapshots/{bookmarkId}/{snapshotId}.html`

## 10. 下一步

配置完成后，你可以：

1. ✅ 在浏览器扩展中创建快照
2. ✅ 在 Web 应用中查看快照
3. ✅ 下载快照为 HTML 文件
4. ✅ 删除不需要的快照

如果遇到问题，请查看：
- Cloudflare Pages 函数日志
- 浏览器控制台错误
- R2 存储桶内容

祝使用愉快！🎉
