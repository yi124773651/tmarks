/**
 * Snapshot Service
 * 使用 SingleFile 捕获完整网页内容
 */

/**
 * 捕获当前标签页的完整 HTML
 * 使用浏览器的 scripting API 注入 SingleFile 脚本
 */
export async function capturePageSnapshot(tabId: number): Promise<string> {
  try {
    // 方案1: 使用简单的 DOM 序列化（临时方案）
    // TODO: 集成 SingleFile 以获取完整的网页内容（包括样式、图片等）
    
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // 获取完整的 HTML
        return document.documentElement.outerHTML;
      }
    });

    if (results && results[0] && results[0].result) {
      return results[0].result as string;
    }

    throw new Error('Failed to capture page content');
  } catch (error) {
    console.error('[SnapshotService] Failed to capture page:', error);
    throw error;
  }
}

/**
 * 使用 SingleFile 捕获完整网页
 * 这个函数需要 SingleFile 库的支持
 * 
 * 集成步骤：
 * 1. 安装 single-file-core: pnpm add single-file-core
 * 2. 在 content script 中注入 SingleFile
 * 3. 使用 SingleFile API 捕获页面
 */
export async function capturePageWithSingleFile(_tabId: number): Promise<string> {
  // TODO: 实现 SingleFile 集成
  // 参考: https://github.com/gildas-lormeau/SingleFile
  
  throw new Error('SingleFile integration not implemented yet');
}

/**
 * 估算 HTML 内容的大小（字节）
 */
export function estimateHtmlSize(html: string): number {
  return new Blob([html]).size;
}

/**
 * 压缩 HTML 内容（移除不必要的空白）
 */
export function compressHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')  // 多个空白字符替换为单个空格
    .replace(/>\s+</g, '><')  // 移除标签之间的空白
    .trim();
}
