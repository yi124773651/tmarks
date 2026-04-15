import { useAnimatedProgress } from './useAnimatedProgress'

export interface SimpleProgressProps {
  percentage: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow'
  animated?: boolean
  className?: string
}

/**
 * 简单的进度条组件
 */
export function SimpleProgress({
  percentage,
  size = 'md',
  color = 'blue',
  animated = false,
  className = ''
}: SimpleProgressProps) {
  const animatedPercentage = useAnimatedProgress(percentage)

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    blue: 'bg-primary',
    green: 'bg-success',
    red: 'bg-destructive',
    yellow: 'bg-warning'
  }

  return (
    <div className={`w-full bg-muted rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full transition-all duration-500 ease-out ${colorClasses[color]} ${
          animated ? 'relative' : ''
        }`}
        style={{ width: `${animatedPercentage}%` }}
      >
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        )}
      </div>
    </div>
  )
}
