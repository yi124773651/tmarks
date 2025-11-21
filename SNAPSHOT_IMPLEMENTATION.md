# 网页快照功能实现总结

## 架构概述

快照功能采用**浏览器扩展 → Cloudflare Workers → R2 存储**的架构：

```
浏览器扩展 (tab)
    ↓ 捕获网页 HTML
    ↓ 通过 API 发送
Cloudflare Workers (tmarks/functions)
    ↓ 接收 HTML
    ↓ 存储到 R2
    ↓ 保存元数据到 D1
Web 应用 (tmarks)
    ↓ 查看快照列表
    ↓ 下载快照
```

## 已实现功能

### 1. 后端 API (Cloudflare Workers)

✅ **文件位置**: `tmarks/functions/api/v1/bookmarks/[id]/snapshots/`

- **创建快照**: `POST /api/v1/bookmarks/:id/snapshots`
  - 接收 HTML 内容
  - 计算内容哈希（SHA-256）
  - 存储到 R2: `snapshots/{bookmarkId}/{snapshotId}.html`
  - 保存元数据到 D1
  - 自动去重（相同内容不重复存储）
  - 自动清理（超过保留数量删除旧快照）

- **获取快照列表**: `GET /api/v1/bookmarks/:id/snapshots`
  - 返回所有快照版本
  - 按版本号降序排序

- **查看快照**: `GET /api/v1/bookmarks/:id/snapshots/:snapshotId`
  - 直接返回 HTML 内容
  - 支持在新窗口打开

- **删除快照**: `DELETE /api/v1/bookmarks/:id/snapshots/:snapshotId`
  - 同时删除 R2 文件和 D1 记录

- **批量清理**: `POST /api/v1/bookmarks/:id/snapshots/cleanup`
  - 按保留数量清理
  - 按时间清理（可选）

### 2. 数据库 (D1)

✅ **文件位置**: `tmarks/migrations/add_snapshots.sql`

**snapshots 表**:
```sql
- id: 快照 ID (UUID)
- bookmark_id: 书签 ID
- version: 版本号（自增）
- file_path: R2 文件路径
- file_size: 文件大小
- content_hash: 内容哈希（SHA-256）
- snapshot_title: 快照标题
- is_latest: 是否最新版本
- created_at: 创建时间
```

**bookmarks 表更新**:
```sql
- has_snapshot: 是否有快照
- latest_snapshot_at: 最新快照时间
- snapshot_count: 快照数量（可选）
```

### 3. 浏览器扩展 (tab)

✅ **快照捕获**: `tab/src/lib/services/snapshot-service.ts`
- 当前使用 `document.documentElement.outerHTML` 捕获 HTML
- 预留 SingleFile 集成接口

✅ **API 集成**: `tab/src/lib/api/tmarks/snapshots.ts`
- SnapshotsAPI 类
- 创建、获取、删除快照方法

✅ **书签服务**: `tab/src/lib/services/bookmark-service.ts`
- 保存书签时可选创建快照
- 自动捕获当前页面 HTML
- 通过 API 发送到服务器

✅ **UI 组件**: `tab/src/popup/Popup.tsx`
- "创建快照"复选框
- 集成到书签保存流程

✅ **状态管理**: `tab/src/lib/store/index.ts`
- createSnapshot 状态
- setCreateSnapshot 方法

### 4. 类型定义

✅ **后端类型** (`tmarks/src/lib/types.ts`):
```typescript
interface Bookmark {
  has_snapshot: boolean
  latest_snapshot_at: string | null
  snapshot_count?: number
}

interface UserPreferences {
  snapshot_retention_count: number
  snapshot_auto_create: boolean
  snapshot_auto_dedupe: boolean
  snapshot_auto_cleanup_days: number
}
```

✅ **扩展类型** (`tab/src/types/index.ts`):
```typescript
interface BookmarkInput {
  createSnapshot?: boolean
}
```

## 工作流程

### 用户保存书签时创建快照

1. 用户在浏览器扩展中勾选"创建快照"
2. 点击"保存书签"
3. 扩展捕获当前页面的 HTML
4. 通过 API 发送到 Cloudflare Workers
5. Workers 将 HTML 存储到 R2
6. Workers 保存元数据到 D1
7. 返回成功响应

### 数据流

```
用户操作
  ↓
浏览器扩展 Popup
  ↓ createSnapshot = true
Store (saveBookmark)
  ↓
BookmarkService
  ↓ capturePageSnapshot(tabId)
SnapshotService
  ↓ document.documentElement.outerHTML
BookmarkAPI
  ↓ POST /api/v1/bookmarks/:id/snapshots
Cloudflare Workers
  ↓ 存储 HTML 到 R2
  ↓ 保存元数据到 D1
返回成功
```

## 待实现功能

### 第一优先级：SingleFile 集成

⏳ **目标**: 捕获完整网页（包括样式、图片、字体等）

**实现步骤**:
1. 安装 `single-file-core` 包
   ```bash
   cd tab
   pnpm add single-file-core
   ```

2. 更新 `snapshot-service.ts`:
   ```typescript
   import * as singleFile from 'single-file-core';
   
   export async function capturePageWithSingleFile(tabId: number) {
     // 注入 SingleFile 脚本
     await chrome.scripting.executeScript({
       target: { tabId },
       files: ['node_modules/single-file-core/single-file.js']
     });
     
     // 执行捕获
     const results = await chrome.scripting.executeScript({
       target: { tabId },
       func: async () => {
         const singlefile = window.singlefile;
         const pageData = await singlefile.getPageData({
           removeHiddenElements: true,
           removeUnusedStyles: true,
           compressHTML: true,
         });
         return pageData.content;
       }
     });
     
     return results[0].result;
   }
   ```

3. 更新 `bookmark-service.ts`:
   ```typescript
   const { capturePageWithSingleFile } = await import('./snapshot-service');
   const htmlContent = await capturePageWithSingleFile(tab.id);
   ```

### 第二优先级：Web 应用查看功能 ✅

**已实现**: `SnapshotViewer` 组件

**功能**:
- ✅ 快照列表显示
- ✅ 在新窗口查看快照
- ✅ 下载快照为 HTML 文件
- ✅ 删除快照
- ✅ 显示版本信息和创建时间

### 第三优先级：高级功能

⏳ **功能列表**:
- 快照对比（diff 视图）
- 定时自动快照
- 快照搜索
- 快照分享
- 增量快照（只保存变化部分）

## 文件清单

### 后端 (tmarks)

**API 端点**:
- `functions/api/v1/bookmarks/[id]/snapshots.ts` - 列表和创建
- `functions/api/v1/bookmarks/[id]/snapshots/[snapshotId].ts` - 查看和删除
- `functions/api/v1/bookmarks/[id]/snapshots/cleanup.ts` - 批量清理

**数据库**:
- `migrations/add_snapshots.sql` - 快照表结构

**类型**:
- `src/lib/types.ts` - Bookmark 和 UserPreferences 类型

**Mock 数据**:
- `src/mock/bookmarkData.ts` - 包含快照字段的测试数据

### 前端扩展 (tab)

**API 客户端**:
- `src/lib/api/tmarks/snapshots.ts` - SnapshotsAPI 类
- `src/lib/api/tmarks/index.ts` - 导出 SnapshotsAPI

**服务**:
- `src/lib/services/snapshot-service.ts` - 快照捕获服务
- `src/lib/services/bookmark-service.ts` - 集成快照创建
- `src/lib/services/bookmark-api.ts` - API 调用封装

**UI**:
- `src/popup/Popup.tsx` - 快照复选框

**Web 应用 (tmarks)**:
- `src/components/bookmarks/SnapshotViewer.tsx` - 快照查看器组件
- `src/components/bookmarks/BookmarkCardView.tsx` - 集成快照查看器

**状态管理**:
- `src/lib/store/index.ts` - createSnapshot 状态

**类型**:
- `src/types/index.ts` - BookmarkInput 类型

**文档**:
- `docs/SINGLEFILE_INTEGRATION.md` - SingleFile 集成指南

## 配置说明

### R2 存储桶

需要在 Cloudflare 中创建 R2 存储桶：

1. 登录 Cloudflare Dashboard
2. 进入 R2 页面
3. 创建存储桶（例如：`tmarks-snapshots`）
4. 在 `wrangler.toml` 中配置：
   ```toml
   [[r2_buckets]]
   binding = "SNAPSHOTS"
   bucket_name = "tmarks-snapshots"
   ```

### 环境变量

在 `.dev.vars` 和生产环境中配置：
```
SNAPSHOT_RETENTION_COUNT=5
SNAPSHOT_AUTO_CLEANUP=true
```

## 注意事项

1. **文件大小限制**: 
   - 当前使用简单 HTML，文件较小（通常 < 1MB）
   - 使用 SingleFile 后，文件可能达到几 MB
   - 需要考虑 R2 存储成本

2. **性能考虑**:
   - 捕获大型网页可能需要几秒钟
   - 建议异步处理，不阻塞书签保存

3. **权限要求**:
   - 扩展需要 `scripting` 权限
   - 需要访问当前标签页的权限

4. **兼容性**:
   - 某些网页可能无法完美保存（动态内容、iframe 等）
   - 需要处理跨域资源

## 测试清单

- [ ] 保存书签时创建快照
- [ ] 快照成功存储到 R2
- [ ] 快照元数据保存到 D1
- [ ] 查看快照列表
- [ ] 下载快照
- [ ] 删除快照
- [ ] 自动去重（相同内容）
- [ ] 自动清理（超过保留数量）
- [ ] 错误处理（网络失败、权限不足等）

## 下一步

1. **测试当前实现**
   - 在浏览器中加载扩展
   - 保存书签并勾选"创建快照"
   - 验证快照是否成功创建

2. **集成 SingleFile**
   - 按照 `docs/SINGLEFILE_INTEGRATION.md` 的步骤
   - 实现完整网页捕获

3. **添加 Web 应用查看功能**
   - 创建快照列表组件
   - 实现快照查看器

4. **优化和完善**
   - 添加进度提示
   - 优化文件大小
   - 改进错误处理
