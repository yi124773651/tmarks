/**
 * HTML 书签解析器
 * 解析 Netscape 书签格式的 HTML 文件
 */

import type { 
  ImportParser, 
  ImportData, 
  ParsedBookmark, 
  ParsedTag, 
  ValidationResult 
} from '../../../../shared/import-export-types'

export class HtmlParser implements ImportParser {
  readonly format = 'html' as const

  async parse(content: string): Promise<ImportData> {
    try {
      // 清理和预处理 HTML 内容
      const cleanContent = this.preprocessHtml(content)
      
      // 解析书签
      const bookmarks = this.parseBookmarks(cleanContent)
      
      // 提取标签
      const tags = this.extractTags(bookmarks)
      
      return {
        bookmarks,
        tags,
        metadata: {
          source: 'html',
          total_items: bookmarks.length,
          parsed_at: new Date().toISOString()
        }
      }
    } catch (error) {
      throw new Error(`HTML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async validate(data: ImportData): Promise<ValidationResult> {
    const errors: any[] = []
    const warnings: any[] = []

    // 验证书签数据
    data.bookmarks.forEach((bookmark, index) => {
      // 必需字段验证
      if (!bookmark.title?.trim()) {
        errors.push({
          field: `bookmarks[${index}].title`,
          message: 'Title is required',
          value: bookmark.title
        })
      }

      if (!bookmark.url?.trim()) {
        errors.push({
          field: `bookmarks[${index}].url`,
          message: 'URL is required',
          value: bookmark.url
        })
      } else if (!this.isValidUrl(bookmark.url)) {
        errors.push({
          field: `bookmarks[${index}].url`,
          message: 'Invalid URL format',
          value: bookmark.url
        })
      }

      // 警告检查
      if (bookmark.title && bookmark.title.length > 200) {
        warnings.push({
          field: `bookmarks[${index}].title`,
          message: 'Title is very long, may be truncated',
          value: bookmark.title.length
        })
      }

      if (bookmark.tags.length > 20) {
        warnings.push({
          field: `bookmarks[${index}].tags`,
          message: 'Too many tags, some may be ignored',
          value: bookmark.tags.length
        })
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  private preprocessHtml(content: string): string {
    // 移除 BOM
    content = content.replace(/^\uFEFF/, '')
    
    // 标准化换行符
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    
    // 修复常见的编码问题
    content = content
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    
    return content
  }

  private parseBookmarks(content: string): ParsedBookmark[] {
    const bookmarks: ParsedBookmark[] = []
    
    // 使用正则表达式匹配书签条目
    const bookmarkRegex = /<DT><A\s+([^>]+)>([^<]*)<\/A>(?:\s*<DD>([^<\n]*?))?/gi
    
    let match
    let currentFolder = ''
    
    // 首先提取文件夹信息
    const folderRegex = /<DT><H3[^>]*>([^<]+)<\/H3>/gi
    const folderMatches = content.matchAll(folderRegex)
    const folders = Array.from(folderMatches).map(m => m[1].trim())
    
    // 解析书签
    while ((match = bookmarkRegex.exec(content)) !== null) {
      const [, attributes, title, description] = match
      
      // 解析属性
      const parsedAttrs = this.parseAttributes(attributes)
      
      if (!parsedAttrs.href) continue
      
      // 确定当前文件夹
      const bookmarkIndex = match.index!
      currentFolder = this.findCurrentFolder(content, bookmarkIndex, folders)
      
      const bookmark: ParsedBookmark = {
        title: this.decodeHtml(title.trim()) || 'Untitled',
        url: this.decodeHtml(parsedAttrs.href),
        description: description ? this.decodeHtml(description.trim()) : undefined,
        tags: this.parseTags(parsedAttrs.tags, currentFolder),
        created_at: this.parseDate(parsedAttrs.add_date),
        folder: currentFolder || undefined
      }
      
      bookmarks.push(bookmark)
    }
    
    return bookmarks
  }

  private parseAttributes(attributeString: string): Record<string, string> {
    const attrs: Record<string, string> = {}
    
    // 匹配属性键值对
    const attrRegex = /(\w+)=["']([^"']*?)["']/g
    
    let match
    while ((match = attrRegex.exec(attributeString)) !== null) {
      const [, key, value] = match
      attrs[key.toLowerCase()] = value
    }
    
    return attrs
  }

  private findCurrentFolder(content: string, bookmarkIndex: number, folders: string[]): string {
    // 在书签位置之前查找最近的文件夹标题
    const beforeBookmark = content.substring(0, bookmarkIndex)
    const folderRegex = /<DT><H3[^>]*>([^<]+)<\/H3>/gi
    
    let lastFolder = ''
    let match
    
    while ((match = folderRegex.exec(beforeBookmark)) !== null) {
      lastFolder = match[1].trim()
    }
    
    return lastFolder
  }

  private parseTags(tagsString?: string, folder?: string): string[] {
    const tags: string[] = []
    
    // 从 TAGS 属性解析
    if (tagsString) {
      const tagList = tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
      tags.push(...tagList)
    }
    
    // 将文件夹作为标签
    if (folder && folder !== '未分类' && folder !== 'Bookmarks') {
      tags.push(folder)
    }
    
    // 去重并标准化
    return [...new Set(tags.map(tag => this.normalizeTag(tag)))]
  }

  private normalizeTag(tag: string): string {
    return tag
      .trim()
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff\s-]/g, '') // 保留中文、英文、数字、空格、连字符
      .replace(/\s+/g, '-') // 空格转连字符
      .substring(0, 50) // 限制长度
  }

  private extractTags(bookmarks: ParsedBookmark[]): ParsedTag[] {
    const tagSet = new Set<string>()
    
    bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => tagSet.add(tag))
    })
    
    return Array.from(tagSet).map(name => ({
      name,
      color: this.generateTagColor(name)
    }))
  }

  private generateTagColor(tagName: string): string {
    // 基于标签名生成一致的颜色
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
      '#ec4899', '#6366f1', '#14b8a6', '#eab308'
    ]
    
    let hash = 0
    for (let i = 0; i < tagName.length; i++) {
      hash = ((hash << 5) - hash + tagName.charCodeAt(i)) & 0xffffffff
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  private parseDate(timestamp?: string): string | undefined {
    if (!timestamp) return undefined
    
    try {
      // Unix 时间戳转换
      const date = new Date(parseInt(timestamp) * 1000)
      return date.toISOString()
    } catch {
      return undefined
    }
  }

  private decodeHtml(text: string): string {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取解析统计信息
   */
  getParseStats(content: string): {
    estimatedBookmarks: number
    estimatedFolders: number
    fileSize: number
    encoding: string
  } {
    const bookmarkMatches = content.match(/<DT><A\s+[^>]+>/gi) || []
    const folderMatches = content.match(/<DT><H3[^>]*>/gi) || []
    
    return {
      estimatedBookmarks: bookmarkMatches.length,
      estimatedFolders: folderMatches.length,
      fileSize: new TextEncoder().encode(content).length,
      encoding: this.detectEncoding(content)
    }
  }

  private detectEncoding(content: string): string {
    // 简单的编码检测
    if (content.includes('charset=UTF-8') || content.includes('charset="UTF-8"')) {
      return 'UTF-8'
    }
    if (content.includes('charset=GBK') || content.includes('charset="GBK"')) {
      return 'GBK'
    }
    return 'Unknown'
  }
}

/**
 * 创建 HTML 解析器实例
 */
export function createHtmlParser(): HtmlParser {
  return new HtmlParser()
}

/**
 * 快速解析 HTML 书签文件
 */
export async function parseHtmlBookmarks(content: string): Promise<ImportData> {
  const parser = createHtmlParser()
  return parser.parse(content)
}
