# SingleFile 集成指南

## 概述

SingleFile 是一个强大的网页保存工具，可以将网页保存为单个 HTML 文件，包含所有资源（CSS、图片、字体等）。

## 当前状态

✅ **已实现**：
- 基础快照功能（保存原始 HTML）
- 快照 API 集成
- 快照按钮 UI

⏳ **待实现**：
- SingleFile 集成（保存完整网页）

## 集成方案

### 方案 1: 使用 single-file-core（推荐）

#### 1. 安装依赖

```bash
cd tab
pnpm add single-file-core
```

#### 2. 创建 SingleFile 包装器

在 `tab/src/lib/services/snapshot-service.ts` 中实现：

```typescript
import * as singleFile from 'single-file-core';

export async function capturePageWithSingleFile(tabId: number): Promise<string> {
  // 注入 SingleFile 脚本到页面
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['node_modules/single-file-core/single-file.js']
  });

  // 执行捕获
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      // @ts-ignore
      const singlefile = window.singlefile;
      const pageData = await singlefile.getPageData({
        removeHiddenElements: true,
        removeUnusedStyles: true,
        removeUnusedFonts: true,
        compressHTML: true,
      });
      return pageData.content;
    }
  });

  return results[0].result as string;
}
```

#### 3. 更新 bookmark-service.ts

```typescript
// 使用 SingleFile 而不是简单的 HTML
const { capturePageWithSingleFile } = await import('./snapshot-service');
const htmlContent = await capturePageWithSingleFile(tab.id);
```

### 方案 2: 使用 SingleFile 扩展 API

如果用户已经安装了 SingleFile 扩展，可以直接调用它的 API：

```typescript
export async function captureWithSingleFileExtension(tabId: number): Promise<string> {
  // SingleFile 扩展 ID
  const SINGLEFILE_EXTENSION_ID = 'mpiodijhokgodhhofbcjdecpffjipkle';
  
  try {
    const response = await chrome.runtime.sendMessage(
      SINGLEFILE_EXTENSION_ID,
      {
        method: 'getPageData',
        tabId: tabId
      }
    );
    
    return response.content;
  } catch (error) {
    console.error('SingleFile extension not found:', error);
    throw new Error('Please install SingleFile extension');
  }
}
```

### 方案 3: 内嵌 SingleFile 脚本

将 SingleFile 的核心脚本直接包含在扩展中：

1. 下载 SingleFile 的核心脚本
2. 放在 `tab/public/lib/single-file.js`
3. 在 manifest.json 中声明为 web_accessible_resources
4. 在需要时注入

## 推荐实现步骤

### 第一阶段：基础集成（当前）

✅ 使用简单的 `document.documentElement.outerHTML`
- 优点：简单、快速、无依赖
- 缺点：不包含外部资源、样式可能丢失

### 第二阶段：SingleFile 集成

1. **安装 single-file-core**
   ```bash
   pnpm add single-file-core
   ```

2. **更新 snapshot-service.ts**
   - 实现 `capturePageWithSingleFile` 函数
   - 配置 SingleFile 选项

3. **测试**
   - 测试不同类型的网页
   - 验证资源是否完整保存
   - 检查文件大小

4. **优化**
   - 添加压缩选项
   - 移除不必要的资源
   - 限制文件大小

### 第三阶段：高级功能

- 快照预览
- 快照对比
- 增量快照
- 定时快照

## SingleFile 配置选项

```typescript
interface SingleFileOptions {
  removeHiddenElements?: boolean;      // 移除隐藏元素
  removeUnusedStyles?: boolean;        // 移除未使用的样式
  removeUnusedFonts?: boolean;         // 移除未使用的字体
  compressHTML?: boolean;              // 压缩 HTML
  compressCSS?: boolean;               // 压缩 CSS
  removeImports?: boolean;             // 移除 @import
  removeScripts?: boolean;             // 移除脚本
  removeAudioSrc?: boolean;            // 移除音频
  removeVideoSrc?: boolean;            // 移除视频
  removeAlternativeFonts?: boolean;    // 移除备用字体
  removeAlternativeImages?: boolean;   // 移除备用图片
  groupDuplicateImages?: boolean;      // 合并重复图片
  maxResourceSize?: number;            // 最大资源大小（字节）
}
```

## 参考资源

- [SingleFile GitHub](https://github.com/gildas-lormeau/SingleFile)
- [SingleFile Core](https://github.com/gildas-lormeau/single-file-core)
- [SingleFile API](https://github.com/gildas-lormeau/SingleFile/wiki/API)

## 注意事项

1. **文件大小**：完整的网页快照可能很大（几 MB），需要考虑存储成本
2. **性能**：捕获大型网页可能需要几秒钟
3. **权限**：需要 `scripting` 权限来注入脚本
4. **兼容性**：某些网页可能无法完美保存（如动态内容、iframe 等）

## 当前实现

目前使用简单的 HTML 捕获作为临时方案：

```typescript
// tab/src/lib/services/snapshot-service.ts
export async function capturePageSnapshot(tabId: number): Promise<string> {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => document.documentElement.outerHTML
  });
  return results[0].result as string;
}
```

这个方案可以工作，但不包含外部资源。要获得完整的网页快照，需要集成 SingleFile。
