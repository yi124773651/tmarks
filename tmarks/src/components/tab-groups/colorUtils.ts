/**
 * 颜色工具函数和常量
 */

// 颜色值使用英文标识符，便于存储和国际化
export const COLORS = [
  { key: 'none', value: null, bg: 'bg-gray-100', border: 'border-gray-300' },
  { key: 'red', value: 'red', bg: 'bg-red-100', border: 'border-red-300' },
  { key: 'orange', value: 'orange', bg: 'bg-orange-100', border: 'border-orange-300' },
  { key: 'yellow', value: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { key: 'green', value: 'green', bg: 'bg-green-100', border: 'border-green-300' },
  { key: 'blue', value: 'blue', bg: 'bg-blue-100', border: 'border-blue-300' },
  { key: 'purple', value: 'purple', bg: 'bg-purple-100', border: 'border-purple-300' },
  { key: 'pink', value: 'pink', bg: 'bg-pink-100', border: 'border-pink-300' },
] as const

// 兼容旧的中文颜色值
const COLOR_MAP: Record<string, string> = {
  '红色': 'bg-red-50 border-red-300 hover:bg-red-100',
  '橙色': 'bg-orange-50 border-orange-300 hover:bg-orange-100',
  '黄色': 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100',
  '绿色': 'bg-green-50 border-green-300 hover:bg-green-100',
  '蓝色': 'bg-blue-50 border-blue-300 hover:bg-blue-100',
  '紫色': 'bg-purple-50 border-purple-300 hover:bg-purple-100',
  '粉色': 'bg-pink-50 border-pink-300 hover:bg-pink-100',
  'red': 'bg-red-50 border-red-300 hover:bg-red-100',
  'orange': 'bg-orange-50 border-orange-300 hover:bg-orange-100',
  'yellow': 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100',
  'green': 'bg-green-50 border-green-300 hover:bg-green-100',
  'blue': 'bg-blue-50 border-blue-300 hover:bg-blue-100',
  'purple': 'bg-purple-50 border-purple-300 hover:bg-purple-100',
  'pink': 'bg-pink-50 border-pink-300 hover:bg-pink-100',
}

const LEFT_BORDER_MAP: Record<string, string> = {
  '红色': 'border-l-red-500',
  '橙色': 'border-l-orange-500',
  '黄色': 'border-l-yellow-500',
  '绿色': 'border-l-green-500',
  '蓝色': 'border-l-blue-500',
  '紫色': 'border-l-purple-500',
  '粉色': 'border-l-pink-500',
  'red': 'border-l-red-500',
  'orange': 'border-l-orange-500',
  'yellow': 'border-l-yellow-500',
  'green': 'border-l-green-500',
  'blue': 'border-l-blue-500',
  'purple': 'border-l-purple-500',
  'pink': 'border-l-pink-500',
}

export function getColorClasses(color: string | null): string {
  if (!color) return 'bg-card border-border hover:bg-accent'
  return COLOR_MAP[color] || 'bg-card border-border hover:bg-accent'
}

export function getLeftBorderColor(color: string | null): string {
  if (!color) return 'border-l-border'
  return LEFT_BORDER_MAP[color] || 'border-l-border'
}
