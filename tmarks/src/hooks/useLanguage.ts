import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import { supportedLanguages, type LanguageCode } from '@/i18n'

/**
 * 语言切换 hook
 * 提供当前语言、切换语言、支持的语言列表等功能
 */
export function useLanguage() {
  const { i18n } = useTranslation()

  const currentLanguage = i18n.language as LanguageCode

  const changeLanguage = useCallback(
    async (lang: LanguageCode) => {
      await i18n.changeLanguage(lang)
      // i18next-browser-languagedetector 会自动保存到 localStorage
    },
    [i18n]
  )

  const getCurrentLanguageInfo = useCallback(() => {
    return supportedLanguages.find((l) => l.code === currentLanguage) || supportedLanguages[0]
  }, [currentLanguage])

  return {
    currentLanguage,
    changeLanguage,
    supportedLanguages,
    getCurrentLanguageInfo
  }
}
