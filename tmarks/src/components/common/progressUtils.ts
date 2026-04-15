/**
 * 格式化时间
 * @param seconds 秒数
 * @param t 翻译函数
 * @returns 格式化后的时间字符串
 */
export function formatTime(
  seconds: number, 
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (seconds < 60) {
    return t('time.seconds', { count: Math.round(seconds) })
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return remainingSeconds > 0 
      ? t('time.minutesSeconds', { minutes, seconds: remainingSeconds })
      : t('time.minutes', { count: minutes })
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 
      ? t('time.hoursMinutes', { hours, minutes })
      : t('time.hours', { count: hours })
  }
}
