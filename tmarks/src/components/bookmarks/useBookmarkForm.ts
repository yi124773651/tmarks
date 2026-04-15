import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { logger } from '@/lib/logger'
import { useCreateBookmark, useUpdateBookmark, useDeleteBookmark } from '@/hooks/useBookmarks'
import { useCreateTag } from '@/hooks/useTags'
import { bookmarksService } from '@/services/bookmarks'
import type { Bookmark, CreateBookmarkRequest, UpdateBookmarkRequest, Tag } from '@/lib/types'

interface UseBookmarkFormProps {
  bookmark?: Bookmark | null
  onClose: () => void
  onSuccess?: () => void
  tags: Tag[]
}

export function useBookmarkForm({ bookmark, onClose, onSuccess, tags }: UseBookmarkFormProps) {
  const { t } = useTranslation('bookmarks')
  const isEditing = !!bookmark

  const [title, setTitle] = useState(bookmark?.title || '')
  const [url, setUrl] = useState(bookmark?.url || '')
  const [description, setDescription] = useState(bookmark?.description || '')
  const [coverImage, setCoverImage] = useState(bookmark?.cover_image || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    bookmark?.tags.map((t) => t.id) || []
  )
  const [isPinned, setIsPinned] = useState(bookmark?.is_pinned || false)
  const [isArchived, setIsArchived] = useState(bookmark?.is_archived || false)
  const [isPublic, setIsPublic] = useState(bookmark?.is_public || false)
  const [error, setError] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [urlWarning, setUrlWarning] = useState<{ exists: true; bookmark: Bookmark } | null>(null)
  const [checkingUrl, setCheckingUrl] = useState(false)

  const createBookmark = useCreateBookmark()
  const updateBookmark = useUpdateBookmark()
  const deleteBookmark = useDeleteBookmark()
  const createTag = useCreateTag()

  useEffect(() => {
    let isMounted = true
    const checkUrl = async () => {
      if (!url.trim() || (isEditing && url.trim() === bookmark?.url)) {
        setUrlWarning(null)
        setCheckingUrl(false)
        return
      }

      if (url.trim().length < 10) {
        setUrlWarning(null)
        setCheckingUrl(false)
        return
      }

      if (!validateUrl(url)) {
        setUrlWarning(null)
        setCheckingUrl(false)
        return
      }

      setCheckingUrl(true)
      try {
        const result = await bookmarksService.checkUrlExists(url.trim())
        if (!isMounted) return
        if (result.exists && result.bookmark) {
          setUrlWarning({ exists: true, bookmark: result.bookmark })
        } else {
          setUrlWarning(null)
        }
      } catch (error) {
        logger.error('Failed to check URL:', error)
      } finally {
        if (isMounted) setCheckingUrl(false)
      }
    }

    const timeoutId = setTimeout(checkUrl, 800)
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [url, isEditing, bookmark?.url])

  const validateUrl = (urlStr: string) => {
    try {
      new URL(urlStr)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError(t('form.validation.titleRequired'))
      return
    }

    if (!url.trim()) {
      setError(t('form.validation.urlRequired'))
      return
    }

    if (!validateUrl(url)) {
      setError(t('form.validation.urlInvalid'))
      return
    }

    if (!isEditing && urlWarning?.exists) {
      setError(t('form.validation.urlExists'))
      return
    }

    try {
      if (isEditing && bookmark) {
        const updateData: UpdateBookmarkRequest = {
          tag_ids: selectedTagIds,
          is_pinned: isPinned,
          is_archived: isArchived,
          is_public: isPublic,
        }

        if (title.trim() !== (bookmark.title || '')) {
          updateData.title = title.trim()
        }

        if (url.trim() !== (bookmark.url || '')) {
          updateData.url = url.trim()
        }

        const originalDescription = bookmark.description || ''
        if (description.trim() !== originalDescription) {
          updateData.description = description.trim() ? description.trim() : null
        }

        const originalCoverImage = bookmark.cover_image || ''
        if (coverImage.trim() !== originalCoverImage) {
          updateData.cover_image = coverImage.trim() ? coverImage.trim() : null
        }

        await updateBookmark.mutateAsync({ id: bookmark.id, data: updateData })
      } else {
        const createData: CreateBookmarkRequest = {
          title: title.trim(),
          url: url.trim(),
          description: description.trim() ? description.trim() : undefined,
          cover_image: coverImage.trim() ? coverImage.trim() : undefined,
          tag_ids: selectedTagIds,
          is_pinned: isPinned,
          is_archived: isArchived,
          is_public: isPublic,
        }

        await createBookmark.mutateAsync(createData)
      }
      onSuccess?.()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : t('form.operationFailed'))
    }
  }

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId))
    } else {
      setSelectedTagIds([...selectedTagIds, tagId])
    }
  }

  const processTagInput = async () => {
    const input = tagInput.trim()
    if (!input) return

    const tagNames = input
      .split(/[,，]/)
      .map(name => name.trim())
      .filter(name => name.length > 0)

    if (tagNames.length === 0) return

    const newSelectedIds = [...selectedTagIds]

    for (const tagName of tagNames) {
      const existingTag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase())
      if (existingTag) {
        if (!newSelectedIds.includes(existingTag.id)) {
          newSelectedIds.push(existingTag.id)
        }
      } else {
        try {
          const newTag = await createTag.mutateAsync({ name: tagName })
          newSelectedIds.push(newTag.id)
        } catch (error) {
          console.error('Failed to create tag:', error)
          setError(t('form.createTagFailed', { name: tagName }))
          return
        }
      }
    }

    setSelectedTagIds(newSelectedIds)
    setTagInput('')
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!bookmark) return

    setShowDeleteConfirm(false)
    try {
      await deleteBookmark.mutateAsync(bookmark.id)
      onSuccess?.()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : t('form.deleteFailed'))
    }
  }

  const isPending = createBookmark.isPending || updateBookmark.isPending || deleteBookmark.isPending || createTag.isPending

  return {
    title, setTitle,
    url, setUrl,
    description, setDescription,
    coverImage, setCoverImage,
    selectedTagIds, toggleTag,
    isPinned, setIsPinned,
    isArchived, setIsArchived,
    isPublic, setIsPublic,
    error, setError,
    tagInput, setTagInput,
    showDeleteConfirm, setShowDeleteConfirm,
    urlWarning, checkingUrl,
    isPending,
    handleSubmit,
    processTagInput,
    handleDeleteClick,
    handleConfirmDelete,
    isEditing,
    t
  }
}
