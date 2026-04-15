import { useState, useEffect, type RefObject } from 'react'

interface ColumnConfig {
  minColumnWidth: number
  gap: number
  minCols?: number
  maxCols?: number
}

/**
 * 根据容器宽度动态计算列数
 */
export function useResponsiveColumns(
  containerRef: RefObject<HTMLDivElement | null>,
  config: ColumnConfig,
) {
  const { minColumnWidth, gap, minCols = 1, maxCols = 4 } = config
  const [columns, setColumns] = useState(minCols)

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth

      let cols = minCols
      for (let i = minCols; i <= maxCols; i++) {
        const totalWidth = i * minColumnWidth + (i - 1) * gap
        if (containerWidth >= totalWidth) {
          cols = i
        } else {
          break
        }
      }
      setColumns(cols)
    }

    updateColumns()
    const resizeObserver = new ResizeObserver(updateColumns)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [containerRef, minColumnWidth, gap, minCols, maxCols])

  return columns
}

/**
 * 移动端 10 秒后隐藏编辑提示
 */
export function useEditHintVisibility() {
  const [showEditHint, setShowEditHint] = useState(true)

  useEffect(() => {
    const isMobile = window.innerWidth < 640
    if (isMobile) {
      const timer = setTimeout(() => setShowEditHint(false), 10000)
      return () => clearTimeout(timer)
    }
    setShowEditHint(false)
  }, [])

  return showEditHint
}
