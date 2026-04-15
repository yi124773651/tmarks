import type { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import type { ExportOptions } from '@shared/import-export-types'

export type ExportScope = 'all' | 'bookmarks' | 'tab_groups'

interface ExportOptionsFormProps {
  scope: ExportScope
  setScope: (scope: ExportScope) => void
  includeDeleted: boolean
  setIncludeDeleted: (include: boolean) => void
  options: ExportOptions
  setOptions: Dispatch<SetStateAction<ExportOptions>>
  disabled?: boolean
}

export function ExportOptionsForm({
  scope,
  setScope,
  includeDeleted,
  setIncludeDeleted,
  options,
  setOptions,
  disabled,
}: ExportOptionsFormProps) {
  const { t } = useTranslation('import')
  const isBookmarksScope = scope === 'all' || scope === 'bookmarks'

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          {t('export.scope')}
        </label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as ExportScope)}
          disabled={disabled}
          className="w-full sm:w-64 h-10 px-3 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <option value="all">{t('export.scopeAll')}</option>
          <option value="bookmarks">{t('export.scopeBookmarks')}</option>
          <option value="tab_groups">{t('export.scopeTabGroups')}</option>
        </select>
      </div>

      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 text-primary border-border rounded focus:ring-primary disabled:opacity-50"
          />
          <span className="text-sm text-foreground">{t('export.includeDeleted')}</span>
        </label>

        <label className={`flex items-center space-x-3 ${!isBookmarksScope ? 'opacity-50' : ''}`}>
          <input
            type="checkbox"
            checked={options.include_tags}
            onChange={(e) => setOptions((prev) => ({ ...prev, include_tags: e.target.checked }))}
            disabled={disabled || !isBookmarksScope}
            className="h-4 w-4 text-primary border-border rounded focus:ring-primary disabled:opacity-50"
          />
          <span className="text-sm text-foreground">{t('export.includeTags')}</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.include_metadata}
            onChange={(e) => setOptions((prev) => ({ ...prev, include_metadata: e.target.checked }))}
            disabled={disabled}
            className="h-4 w-4 text-primary border-border rounded focus:ring-primary disabled:opacity-50"
          />
          <span className="text-sm text-foreground">{t('export.includeMetadata')}</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.format_options?.pretty_print}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                format_options: { ...prev.format_options, pretty_print: e.target.checked },
              }))
            }
            disabled={disabled}
            className="h-4 w-4 text-primary border-border rounded focus:ring-primary disabled:opacity-50"
          />
          <span className="text-sm text-foreground">{t('export.prettyPrint')}</span>
        </label>

        <label className={`flex items-center space-x-3 ${!isBookmarksScope ? 'opacity-50' : ''}`}>
          <input
            type="checkbox"
            checked={options.format_options?.include_click_stats}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                format_options: { ...prev.format_options, include_click_stats: e.target.checked },
              }))
            }
            disabled={disabled || !isBookmarksScope}
            className="h-4 w-4 text-primary border-border rounded focus:ring-primary disabled:opacity-50"
          />
          <span className="text-sm text-foreground">{t('export.includeStats')}</span>
        </label>
      </div>
    </div>
  )
}
