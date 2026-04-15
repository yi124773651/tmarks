import { useState, useEffect } from 'react'

/**
 * 自定义 Hook，用于平滑动画显示进度百分比
 * 从 0 开始动画过渡到目标百分比
 */
export function useAnimatedProgress(percentage: number) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage)
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  return animatedPercentage
}
