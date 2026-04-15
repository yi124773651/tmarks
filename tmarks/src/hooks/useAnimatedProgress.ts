import { useState, useEffect } from 'react'

export function useAnimatedProgress(percentage: number) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // 动画效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage)
    }, 100)

    return () => clearTimeout(timer)
  }, [percentage])

  // 完成状态检测
  useEffect(() => {
    if (percentage >= 100) {
      const timer = setTimeout(() => {
        setIsComplete(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsComplete(false)
    }
  }, [percentage])

  return { animatedPercentage, isComplete }
}
