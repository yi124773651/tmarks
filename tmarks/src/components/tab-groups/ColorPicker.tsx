import { Check } from 'lucide-react'
import { useEffect, useRef } from 'react'

const COLORS = [
  { name: '无', value: null, bg: 'bg-gray-100', border: 'border-gray-300' },
  { name: '红色', value: '红色', bg: 'bg-red-100', border: 'border-red-300' },
  { name: '橙色', value: '橙色', bg: 'bg-orange-100', border: 'border-orange-300' },
  { name: '黄色', value: '黄色', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { name: '绿色', value: '绿色', bg: 'bg-green-100', border: 'border-green-300' },
  { name: '蓝色', value: '蓝色', bg: 'bg-blue-100', border: 'border-blue-300' },
  { name: '紫色', value: '紫色', bg: 'bg-purple-100', border: 'border-purple-300' },
  { name: '粉色', value: '粉色', bg: 'bg-pink-100', border: 'border-pink-300' },
]

interface ColorPickerProps {
  currentColor: string | null
  onColorChange: (color: string | null) => void
  onClose: () => void
}

export function ColorPicker({ currentColor, onColorChange, onClose }: ColorPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  return (
    <div
      ref={pickerRef}
      className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-5 z-50 min-w-[280px]"
    >
      <h4 className="text-sm font-medium text-gray-700 mb-3">选择颜色</h4>
      <div className="grid grid-cols-4 gap-4">
        {COLORS.map((color) => (
          <div key={color.value || 'none'} className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                onColorChange(color.value)
                onClose()
              }}
              className={`w-12 h-12 rounded-lg border-2 ${color.bg} ${color.border} hover:scale-110 hover:shadow-md transition-all relative flex items-center justify-center`}
              title={color.name}
            >
              {currentColor === color.value && (
                <Check className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <span className="text-xs text-gray-600">{color.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function getColorClasses(color: string | null) {
  switch (color) {
    case '红色':
      return 'bg-red-50 border-red-300 hover:bg-red-100'
    case '橙色':
      return 'bg-orange-50 border-orange-300 hover:bg-orange-100'
    case '黄色':
      return 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'
    case '绿色':
      return 'bg-green-50 border-green-300 hover:bg-green-100'
    case '蓝色':
      return 'bg-blue-50 border-blue-300 hover:bg-blue-100'
    case '紫色':
      return 'bg-purple-50 border-purple-300 hover:bg-purple-100'
    case '粉色':
      return 'bg-pink-50 border-pink-300 hover:bg-pink-100'
    default:
      return 'bg-white border-gray-200 hover:bg-gray-50'
  }
}

