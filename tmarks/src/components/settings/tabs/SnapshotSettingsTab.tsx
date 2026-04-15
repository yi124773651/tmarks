/**
 * 快照设置标签页
 * 仅保留快照保留数量设置（唯一被后端消费的快照设置项）
 */

import { useTranslation } from 'react-i18next'
import { Camera, Info } from 'lucide-react'
import { SettingsSection } from '../SettingsSection'
import { InfoBox } from '../InfoBox'

interface SnapshotSettingsTabProps {
  retentionCount: number
  onRetentionCountChange: (count: number) => void
}

export function SnapshotSettingsTab({
  retentionCount,
  onRetentionCountChange,
}: SnapshotSettingsTabProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="space-y-6">
      <SettingsSection icon={Camera} title={t('snapshot.retention.title')} description={t('snapshot.retention.description')}>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t('snapshot.retention.count')}</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={retentionCount}
                onChange={(e) => onRetentionCountChange(parseInt(e.target.value) || 0)}
                min="-1"
                max="100"
                className="input w-16 text-center text-sm"
              />
              <span className="text-xs text-muted-foreground">{t('snapshot.retention.unit')}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('snapshot.retention.tip')}</p>
        </div>
      </SettingsSection>

      <InfoBox icon={Info} title={t('snapshot.infoBox.title')} variant="info">
        <ul className="space-y-1 text-xs">
          <li>• {t('snapshot.infoBox.tip1')}</li>
          <li>• {t('snapshot.infoBox.tip2')}</li>
        </ul>
      </InfoBox>
    </div>
  )
}
