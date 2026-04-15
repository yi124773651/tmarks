import { useState, useMemo } from 'react'
import type { Bookmark } from '@/lib/types'

/**
 * 书签图标三级回退：cover_image → favicon → Google Favicon → 默认图标
 */
export function useFaviconFallback(bookmark: Bookmark) {
  const [coverImageError, setCoverImageError] = useState(false)
  const [faviconError, setFaviconError] = useState(false)
  const [googleFaviconIsDefault, setGoogleFaviconIsDefault] = useState(false)

  const domain = useMemo(() => {
    try {
      return new URL(bookmark.url).hostname
    } catch {
      return bookmark.url.replace(/^https?:\/\//i, '').split('/')[0] || bookmark.url
    }
  }, [bookmark.url])

  const googleFaviconUrl = useMemo(() => {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`
    } catch {
      return ''
    }
  }, [bookmark.url])

  const checkIfGoogleDefaultIcon = (img: HTMLImageElement) => {
    if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
      setGoogleFaviconIsDefault(true)
    }
  }

  const hasCoverImage = !!bookmark.cover_image?.trim() && !coverImageError
  const hasFavicon = !hasCoverImage && !!bookmark.favicon?.trim() && !faviconError
  const hasGoogleFavicon = !hasCoverImage && !hasFavicon && !!googleFaviconUrl && !faviconError && !googleFaviconIsDefault
  const hasAnyIcon = hasCoverImage || hasFavicon || hasGoogleFavicon

  return {
    domain,
    googleFaviconUrl,
    hasCoverImage,
    hasFavicon,
    hasGoogleFavicon,
    hasAnyIcon,
    setCoverImageError,
    setFaviconError,
    checkIfGoogleDefaultIcon,
  }
}
