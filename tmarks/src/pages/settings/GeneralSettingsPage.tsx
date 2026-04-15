import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings, Zap, Camera, Key, Share2, Database, LogOut } from 'lucide-react'
import { usePreferences, useUpdatePreferences } from '@/hooks/usePreferences'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import type { UserPreferences } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { SettingsNav, type SettingsNavGroup } from '@/components/settings/SettingsNav'
import { SettingsSaveBar } from '@/components/settings/SettingsSaveBar'
import { BasicSettingsTab } from '@/components/settings/tabs/BasicSettingsTab'
import { AutomationSettingsTab } from '@/components/settings/tabs/AutomationSettingsTab'
import { SnapshotSettingsTab } from '@/components/settings/tabs/SnapshotSettingsTab'
import { ApiSettingsTab } from '@/components/settings/tabs/ApiSettingsTab'
import { ShareSettingsTab } from '@/components/settings/tabs/ShareSettingsTab'
import { DataSettingsTab } from '@/components/settings/tabs/DataSettingsTab'

const VALID_SECTIONS = ['basic', 'automation', 'snapshot', 'api', 'share', 'data'] as const
type SectionId = typeof VALID_SECTIONS[number]

function isValidSection(s: string | null): s is SectionId {
  return s !== null && (VALID_SECTIONS as readonly string[]).includes(s)
}

export function GeneralSettingsPage() {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: preferences, isLoading } = usePreferences()
  const updatePreferences = useUpdatePreferences()
  const { user, logout } = useAuthStore()
  const { addToast } = useToastStore()

  const sectionFromUrl = searchParams.get('section')
  const initialSection: SectionId = isValidSection(sectionFromUrl) ? sectionFromUrl : 'basic'
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection)
  const [localPreferences, setLocalPreferences] = useState<UserPreferences | null>(null)

  useEffect(() => {
    if (preferences) setLocalPreferences(preferences)
  }, [preferences])

  // 同步 URL query param
  const handleSectionChange = (sectionId: string) => {
    if (isValidSection(sectionId)) {
      setActiveSection(sectionId)
      setSearchParams(sectionId === 'basic' ? {} : { section: sectionId }, { replace: true })
    }
  }

  const handleUpdate = (updates: Partial<UserPreferences>) => {
    if (localPreferences) {
      setLocalPreferences({ ...localPreferences, ...updates })
    }
  }

  // 判断 automation+snapshot 设置是否有修改
  const isDirty = useMemo(() => {
    if (!preferences || !localPreferences) return false
    const keys: (keyof UserPreferences)[] = [
      'enable_search_auto_clear', 'search_auto_clear_seconds',
      'enable_tag_selection_auto_clear', 'tag_selection_auto_clear_seconds',
      'snapshot_retention_count',
    ]
    return keys.some((k) => preferences[k] !== localPreferences[k])
  }, [preferences, localPreferences])

  const handleSave = async () => {
    if (!localPreferences) return
    try {
      await updatePreferences.mutateAsync({
        theme: localPreferences.theme,
        page_size: localPreferences.page_size,
        view_mode: localPreferences.view_mode,
        density: localPreferences.density,
        tag_layout: localPreferences.tag_layout,
        sort_by: localPreferences.sort_by,
        search_auto_clear_seconds: localPreferences.search_auto_clear_seconds,
        tag_selection_auto_clear_seconds: localPreferences.tag_selection_auto_clear_seconds,
        enable_search_auto_clear: localPreferences.enable_search_auto_clear,
        enable_tag_selection_auto_clear: localPreferences.enable_tag_selection_auto_clear,
        snapshot_retention_count: localPreferences.snapshot_retention_count,
      })
      addToast('success', t('message.saveSuccess'))
    } catch (error) {
      let message = t('message.saveFailed')
      if (error instanceof ApiError && error.message) {
        message = t('message.saveFailedWithError', { error: error.message })
      }
      addToast('error', message)
    }
  }

  const handleDiscard = () => {
    if (preferences) {
      setLocalPreferences(preferences)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      addToast('error', t('message.logoutFailed'))
    }
  }

  const navGroups: SettingsNavGroup[] = useMemo(() => [
    {
      label: t('navGroup.account'),
      items: [
        { id: 'basic', label: t('tabs.basic'), icon: Settings },
      ],
    },
    {
      label: t('navGroup.features'),
      items: [
        { id: 'automation', label: t('tabs.automation'), icon: Zap },
        { id: 'snapshot', label: t('tabs.snapshot'), icon: Camera },
      ],
    },
    {
      label: t('navGroup.integration'),
      items: [
        { id: 'api', label: t('tabs.api'), icon: Key },
      ],
    },
    {
      label: t('navGroup.dataAndShare'),
      items: [
        { id: 'share', label: t('tabs.share'), icon: Share2 },
        { id: 'data', label: t('tabs.data'), icon: Database },
      ],
    },
  ], [t])

  if (isLoading || !localPreferences) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-[80%] mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* 页面标题 */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('title')}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {user?.username && <span className="font-medium text-foreground">{user.username}</span>}
              {user?.username && ' · '}
              {t('description')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm flex items-center gap-2 text-error hover:bg-error/10 flex-shrink-0"
            title={t('action.logout')}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('action.logout')}</span>
          </button>
        </div>
      </div>

      {/* 侧栏导航 + 内容 */}
      <div className="card p-3 sm:p-6">
        <SettingsNav groups={navGroups} activeSection={activeSection} onSectionChange={handleSectionChange}>
          {activeSection === 'basic' && <BasicSettingsTab />}

          {activeSection === 'automation' && (
            <AutomationSettingsTab
              searchEnabled={localPreferences.enable_search_auto_clear}
              searchSeconds={localPreferences.search_auto_clear_seconds}
              tagEnabled={localPreferences.enable_tag_selection_auto_clear}
              tagSeconds={localPreferences.tag_selection_auto_clear_seconds}
              onSearchEnabledChange={(enabled) => handleUpdate({ enable_search_auto_clear: enabled })}
              onSearchSecondsChange={(seconds) => handleUpdate({ search_auto_clear_seconds: seconds })}
              onTagEnabledChange={(enabled) => handleUpdate({ enable_tag_selection_auto_clear: enabled })}
              onTagSecondsChange={(seconds) => handleUpdate({ tag_selection_auto_clear_seconds: seconds })}
            />
          )}

          {activeSection === 'snapshot' && (
            <SnapshotSettingsTab
              retentionCount={localPreferences.snapshot_retention_count}
              onRetentionCountChange={(count) => handleUpdate({ snapshot_retention_count: count })}
            />
          )}

          {activeSection === 'api' && <ApiSettingsTab />}
          {activeSection === 'share' && <ShareSettingsTab />}
          {activeSection === 'data' && <DataSettingsTab />}

          <SettingsSaveBar
            isDirty={isDirty}
            isSaving={updatePreferences.isPending}
            onSave={handleSave}
            onDiscard={handleDiscard}
          />
        </SettingsNav>
      </div>
    </div>
  )
}
