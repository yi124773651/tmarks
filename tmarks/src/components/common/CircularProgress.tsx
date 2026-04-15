import { useAnimatedProgress } from './useAnimatedProgress'

export interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showPercentage?: boolean
  className?: string
}

/**
 * 圆形进度指示器
 */
export function CircularProgress({
  percentage,
  size = 64,
  strokeWidth = 4,
  color,
  backgroundColor,
  showPercentage = true,
  className = ''
}: CircularProgressProps) {
  const animatedPercentage = useAnimatedProgress(percentage)

  // 使用 CSS 变量作为默认颜色
  const defaultColor = typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || 'hsl(221.2 83.2% 53.3%)'
    : 'hsl(221.2 83.2% 53.3%)'
  const defaultBgColor = typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || 'hsl(210 40% 96.1%)'
    : 'hsl(210 40% 96.1%)'

  const finalColor = color || defaultColor
  const finalBgColor = backgroundColor || defaultBgColor

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={finalBgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* 进度圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={finalColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-foreground">
            {Math.round(animatedPercentage)}%
          </span>
        </div>
      )}
    </div>
  )
}
