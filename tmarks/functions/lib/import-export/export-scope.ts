export type ExportScope = 'all' | 'bookmarks' | 'tab_groups'

export function parseExportScope(raw: string | null | undefined): ExportScope {
  if (raw === 'bookmarks' || raw === 'tab_groups' || raw === 'all') return raw
  return 'all'
}

export function getExportFilename(exportedAtIso: string, scope: ExportScope): string {
  const date = new Date(exportedAtIso)
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
  const prefix =
    scope === 'bookmarks' ? 'tmarks-bookmarks-export' :
    scope === 'tab_groups' ? 'tmarks-tab-groups-export' :
    'tmarks-export'
  return `${prefix}-${dateStr}-${timeStr}.json`
}

