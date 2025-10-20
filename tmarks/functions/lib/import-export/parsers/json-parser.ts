/**
 * JSON 书签解析器
 * 解析 TMarks 和其他 JSON 格式的书签文件
 */

import type { 
  ImportParser, 
  ImportData, 
  ParsedBookmark, 
  ParsedTag, 
  ValidationResult,
  TMarksExportData 
} from '../../../../shared/import-export-types'

export class JsonParser implements ImportParser {
  readonly format = 'json' as const

  async parse(content: string): Promise<ImportData> {
    try {
      const data = JSON.parse(content)
      
      // 检测 JSON 格式类型
      const formatType = this.detectJsonFormat(data)
      
      switch (formatType) {
        case 'tmarks':
          return this.parseTMarksFormat(data)
        case 'chrome':
          return this.parseChromeFormat(data)
        case 'firefox':
          return this.parseFirefoxFormat(data)
        case 'generic':
          return this.parseGenericFormat(data)
        default:
          throw new Error('Unsupported JSON format')
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format')
      }
      throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async validate(data: ImportData): Promise<ValidationResult> {
    const errors: any[] = []
    const warnings: any[] = []

    // 验证基本结构
    if (!Array.isArray(data.bookmarks)) {
      errors.push({
        field: 'bookmarks',
        message: 'Bookmarks must be an array',
        value: typeof data.bookmarks
      })
    }

    if (!Array.isArray(data.tags)) {
      errors.push({
        field: 'tags',
        message: 'Tags must be an array',
        value: typeof data.tags
      })
    }

    // 验证书签
    data.bookmarks.forEach((bookmark, index) => {
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

      if (!Array.isArray(bookmark.tags)) {
        warnings.push({
          field: `bookmarks[${index}].tags`,
          message: 'Tags should be an array, converting from string',
          value: typeof bookmark.tags
        })
      }
    })

    // 验证标签
    data.tags.forEach((tag, index) => {
      if (!tag.name?.trim()) {
        errors.push({
          field: `tags[${index}].name`,
          message: 'Tag name is required',
          value: tag.name
        })
      }

      if (tag.color && !this.isValidColor(tag.color)) {
        warnings.push({
          field: `tags[${index}].color`,
          message: 'Invalid color format, using default',
          value: tag.color
        })
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  private detectJsonFormat(data: any): string {
    // TMarks 格式检测
    if (data.version && data.exported_at && data.bookmarks && data.tags) {
      return 'tmarks'
    }

    // Chrome 书签格式检测
    if (data.roots && (data.roots.bookmark_bar || data.roots.other)) {
      return 'chrome'
    }

    // Firefox 书签格式检测
    if (data.children && Array.isArray(data.children)) {
      return 'firefox'
    }

    // 通用格式检测
    if (Array.isArray(data) || (data.bookmarks && Array.isArray(data.bookmarks))) {
      return 'generic'
    }

    return 'unknown'
  }

  private parseTMarksFormat(data: TMarksExportData): ImportData {
    const bookmarks: ParsedBookmark[] = data.bookmarks.map(bookmark => ({
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description,
      tags: bookmark.tags || [],
      created_at: bookmark.created_at,
      folder: undefined
    }))

    const tags: ParsedTag[] = data.tags.map(tag => ({
      name: tag.name,
      color: tag.color
    }))

    return {
      bookmarks,
      tags,
      metadata: {
        source: 'json',
        total_items: bookmarks.length,
        parsed_at: new Date().toISOString()
      }
    }
  }

  private parseChromeFormat(data: any): ImportData {
    const bookmarks: ParsedBookmark[] = []
    const tagSet = new Set<string>()

    // 递归解析 Chrome 书签结构
    const parseNode = (node: any, folderPath: string[] = []) => {
      if (node.type === 'url') {
        const bookmark: ParsedBookmark = {
          title: node.name || 'Untitled',
          url: node.url,
          description: undefined,
          tags: folderPath.length > 0 ? [folderPath.join('/')] : [],
          created_at: this.parseTimestamp(node.date_added),
          folder: folderPath.join('/') || undefined
        }
        bookmarks.push(bookmark)
        
        // 添加文件夹作为标签
        if (folderPath.length > 0) {
          tagSet.add(folderPath.join('/'))
        }
      } else if (node.type === 'folder' && node.children) {
        const newPath = [...folderPath, node.name]
        node.children.forEach((child: any) => parseNode(child, newPath))
      }
    }

    // 解析书签栏和其他书签
    if (data.roots.bookmark_bar?.children) {
      data.roots.bookmark_bar.children.forEach((node: any) => 
        parseNode(node, ['书签栏'])
      )
    }

    if (data.roots.other?.children) {
      data.roots.other.children.forEach((node: any) => 
        parseNode(node, ['其他书签'])
      )
    }

    const tags: ParsedTag[] = Array.from(tagSet).map(name => ({
      name,
      color: this.generateTagColor(name)
    }))

    return {
      bookmarks,
      tags,
      metadata: {
        source: 'json',
        total_items: bookmarks.length,
        parsed_at: new Date().toISOString()
      }
    }
  }

  private parseFirefoxFormat(data: any): ImportData {
    const bookmarks: ParsedBookmark[] = []
    const tagSet = new Set<string>()

    // 递归解析 Firefox 书签结构
    const parseNode = (node: any, folderPath: string[] = []) => {
      if (node.type === 'text/x-moz-place' && node.uri) {
        const tags = node.tags ? node.tags.split(',').map((t: string) => t.trim()) : []
        if (folderPath.length > 0) {
          tags.push(folderPath.join('/'))
        }

        const bookmark: ParsedBookmark = {
          title: node.title || 'Untitled',
          url: node.uri,
          description: node.description,
          tags,
          created_at: this.parseTimestamp(node.dateAdded),
          folder: folderPath.join('/') || undefined
        }
        bookmarks.push(bookmark)
        
        // 添加标签
        tags.forEach(tag => tagSet.add(tag))
      } else if (node.children && Array.isArray(node.children)) {
        const newPath = node.title ? [...folderPath, node.title] : folderPath
        node.children.forEach((child: any) => parseNode(child, newPath))
      }
    }

    if (data.children) {
      data.children.forEach((node: any) => parseNode(node))
    }

    const tags: ParsedTag[] = Array.from(tagSet).map(name => ({
      name,
      color: this.generateTagColor(name)
    }))

    return {
      bookmarks,
      tags,
      metadata: {
        source: 'json',
        total_items: bookmarks.length,
        parsed_at: new Date().toISOString()
      }
    }
  }

  private parseGenericFormat(data: any): ImportData {
    let bookmarkArray: any[] = []

    if (Array.isArray(data)) {
      bookmarkArray = data
    } else if (data.bookmarks && Array.isArray(data.bookmarks)) {
      bookmarkArray = data.bookmarks
    } else {
      throw new Error('Cannot find bookmark array in JSON')
    }

    const bookmarks: ParsedBookmark[] = bookmarkArray.map(item => ({
      title: item.title || item.name || 'Untitled',
      url: item.url || item.href || item.link,
      description: item.description || item.desc || item.note,
      tags: this.normalizeTags(item.tags || item.categories || []),
      created_at: item.created_at || item.date || item.timestamp,
      folder: item.folder || item.category
    }))

    // 提取所有标签
    const tagSet = new Set<string>()
    bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => tagSet.add(tag))
    })

    const tags: ParsedTag[] = Array.from(tagSet).map(name => ({
      name,
      color: this.generateTagColor(name)
    }))

    return {
      bookmarks,
      tags,
      metadata: {
        source: 'json',
        total_items: bookmarks.length,
        parsed_at: new Date().toISOString()
      }
    }
  }

  private normalizeTags(tags: any): string[] {
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }
    if (Array.isArray(tags)) {
      return tags.map(tag => String(tag).trim()).filter(Boolean)
    }
    return []
  }

  private parseTimestamp(timestamp: any): string | undefined {
    if (!timestamp) return undefined

    try {
      let date: Date

      if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      } else if (typeof timestamp === 'number') {
        // Chrome 使用微秒时间戳
        if (timestamp > 1000000000000000) {
          date = new Date(timestamp / 1000)
        } else {
          date = new Date(timestamp)
        }
      } else {
        return undefined
      }

      return date.toISOString()
    } catch {
      return undefined
    }
  }

  private generateTagColor(tagName: string): string {
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

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  }
}

/**
 * 创建 JSON 解析器实例
 */
export function createJsonParser(): JsonParser {
  return new JsonParser()
}

/**
 * 快速解析 JSON 书签文件
 */
export async function parseJsonBookmarks(content: string): Promise<ImportData> {
  const parser = createJsonParser()
  return parser.parse(content)
}
