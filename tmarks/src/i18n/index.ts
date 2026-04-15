import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入语言包
import zhCNCommon from './locales/zh-CN/common.json'
import zhCNAuth from './locales/zh-CN/auth.json'
import zhCNErrors from './locales/zh-CN/errors.json'
import zhCNTabGroups from './locales/zh-CN/tabGroups.json'
import zhCNBookmarks from './locales/zh-CN/bookmarks.json'
import zhCNTags from './locales/zh-CN/tags.json'
import zhCNSettings from './locales/zh-CN/settings.json'
import zhCNImport from './locales/zh-CN/import.json'
import zhCNInfo from './locales/zh-CN/info.json'
import zhCNShare from './locales/zh-CN/share.json'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enErrors from './locales/en/errors.json'
import enTabGroups from './locales/en/tabGroups.json'
import enBookmarks from './locales/en/bookmarks.json'
import enTags from './locales/en/tags.json'
import enSettings from './locales/en/settings.json'
import enImport from './locales/en/import.json'
import enInfo from './locales/en/info.json'
import enShare from './locales/en/share.json'

// 支持的语言列表
export const supportedLanguages = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'en', name: 'English', nativeName: 'English' }
] as const

export type LanguageCode = (typeof supportedLanguages)[number]['code']

// 资源配置
const resources = {
  'zh-CN': {
    common: zhCNCommon,
    auth: zhCNAuth,
    errors: zhCNErrors,
    tabGroups: zhCNTabGroups,
    bookmarks: zhCNBookmarks,
    tags: zhCNTags,
    settings: zhCNSettings,
    import: zhCNImport,
    info: zhCNInfo,
    share: zhCNShare
  },
  en: {
    common: enCommon,
    auth: enAuth,
    errors: enErrors,
    tabGroups: enTabGroups,
    bookmarks: enBookmarks,
    tags: enTags,
    settings: enSettings,
    import: enImport,
    info: enInfo,
    share: enShare
  }
}

// 初始化 i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN',
    defaultNS: 'common',
    ns: ['common', 'auth', 'errors', 'tabGroups', 'bookmarks', 'tags', 'settings', 'import', 'info', 'share'],

    detection: {
      // 语言检测顺序：localStorage -> 浏览器语言
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'tmarks-language',
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false // React 已经处理了 XSS
    },

    react: {
      useSuspense: false
    }
  })

export default i18n
