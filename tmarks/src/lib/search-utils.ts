/**
 * 搜索工具函数 - 优化搜索性能
 */

/**
 * 快速字符串匹配（不区分大小写）
 */
export function fastIncludes(text: string, query: string): boolean {
  if (!query) return true
  if (!text) return false
  
  const textLen = text.length
  const queryLen = query.length
  
  if (queryLen > textLen) return false
  if (queryLen === 0) return true
  
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  
  return lowerText.includes(lowerQuery)
}

/**
 * 批量搜索多个字段
 */
export function searchInFields(fields: string[], query: string): boolean {
  if (!query) return true
  
  const lowerQuery = query.toLowerCase()
  
  for (const field of fields) {
    if (field && field.toLowerCase().includes(lowerQuery)) {
      return true
    }
  }
  
  return false
}
