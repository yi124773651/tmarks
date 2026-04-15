/**
 * 自动化设置标签页
 * 搜索和标签的自动清除设置
 */

import { useTranslation } from 'react-i18next'
import { Search, Tag, Zap } from 'lucide-react'
import { Toggle } from '@/components/common/Toggle'
import { SettingsSection, SettingsItem, SettingsDivider } from '../SettingsSection'
import { InfoBox } from '../InfoBox'

interface AutomationSettingsTabProps {
  searchEnabled: boolean
  searchSeconds: number
  tagEnabled: boolean
  tagSeconds: number
  onSearchEnabledChange: (enabled: boolean) => void
  onSearchSecondsChange: (seconds: number) => void
  onTagEnabledChange: (enabled: boolean) => void
  onTagSecondsChange: (seconds: number) => void
}

export function AutomationSettingsTab({
  searchEnabled,
  searchSeconds,
  tagEnabled,
  tagSeconds,
  onSearchEnabledChange,
  onSearchSecondsChange,
  onTagEnabledChange,
  onTagSecondsChange,
}: AutomationSettingsTabProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="space-y-6">
      {/* 搜索自动清除 */}
      <SettingsSection icon={Search} title={t('automation.search.title')} description={t('automation.search.description')}>
        <div className="p-4 rounded-lg bg-card border border-border space-y-4">
          <SettingsItem
            title={t('automation.search.enable')}
            description={t('automation.search.enableHint')}
            action={<Toggle checked={searchEnabled} onChange={onSearchEnabledChange} />}
          />
          {searchEnabled && (
            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{t('automation.search.delay')}</span>
              <input
                type="number"
                value={searchSeconds}
                onChange={(e) => onSearchSecondsChange(parseInt(e.target.value) || 0)}
                min="1"
                max="300"
                className="input w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">{t('automation.search.unit')}</span>
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsDivider />

      {/* 标签选择自动清除 */}
      <SettingsSection icon={Tag} title={t('automation.tag.title')} description={t('automation.tag.description')}>
        <div className="p-4 rounded-lg bg-card border border-border space-y-4">
          <SettingsItem
            title={t('automation.tag.enable')}
            description={t('automation.tag.enableHint')}
            action={<Toggle checked={tagEnabled} onChange={onTagEnabledChange} />}
          />
          {tagEnabled && (
            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{t('automation.tag.delay')}</span>
              <input
                type="number"
                value={tagSeconds}
                onChange={(e) => onTagSecondsChange(parseInt(e.target.value) || 0)}
                min="1"
                max="300"
                className="input w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">{t('automation.tag.unit')}</span>
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsDivider />

      <InfoBox icon={Zap} title={t('automation.infoBox.title')} variant="info">
        <ul className="space-y-1 text-xs">
          <li>• {t('automation.infoBox.tip1')}</li>
        </ul>
      </InfoBox>
    </div>
  )
}
