/**
 * Export API endpoint
 * GET  /api/v1/export        -> download JSON export
 * POST /api/v1/export        -> preview stats (counts + estimated size)
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../lib/types'
import { requireAuth, type AuthContext } from '../../middleware/auth'
import type { ExportOptions } from '../../../shared/import-export-types'
import { createJsonExporter } from '../../lib/import-export/exporters/json-exporter'
import { collectExportData } from '../../lib/import-export/collect-export-data'
import { parseExportScope } from '../../lib/import-export/export-scope'
import { getExportFilename } from '../../lib/import-export/export-scope'
import { estimateExportSize, getExportStats } from '../../lib/import-export/export-stats'

interface ExportPreviewRequest {
  format?: string
  scope?: string
  include_deleted?: boolean
}

function parseCommonOptions(url: URL): {
  scope: ReturnType<typeof parseExportScope>
  includeDeleted: boolean
  options: ExportOptions
} {
  const requestedFormat = url.searchParams.get('format') ?? 'json'
  if (requestedFormat !== 'json') {
    throw new Error(`Unsupported export format: ${requestedFormat}`)
  }

  const scope = parseExportScope(url.searchParams.get('scope'))
  const includeDeleted = url.searchParams.get('include_deleted') === 'true'

  const includeMetadata = url.searchParams.get('include_metadata') !== 'false'
  const includeTags = url.searchParams.get('include_tags') !== 'false'
  const prettyPrint = url.searchParams.get('pretty_print') !== 'false'

  const options: ExportOptions = {
    include_tags: includeTags,
    include_metadata: includeMetadata,
    format_options: {
      pretty_print: prettyPrint,
      include_click_stats: url.searchParams.get('include_stats') === 'true',
      include_user_info: url.searchParams.get('include_user') === 'true',
    },
  }

  return { scope, includeDeleted, options }
}

export const onRequestGet: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    try {
      const userId = context.data.user_id
      const url = new URL(context.request.url)
      let scope: ReturnType<typeof parseExportScope>
      let includeDeleted: boolean
      let options: ExportOptions
      try {
        ;({ scope, includeDeleted, options } = parseCommonOptions(url))
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (message.startsWith('Unsupported export format:')) {
          return new Response(
            JSON.stringify({ error: 'Unsupported export format', message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
        throw error
      }

      const exportData = await collectExportData(context.env.DB, userId, scope, includeDeleted)
      const jsonExporter = createJsonExporter()
      const result = await jsonExporter.export(exportData, options)

      const filename = getExportFilename(exportData.exported_at, scope)
      return new Response(result.content, {
        status: 200,
        headers: {
          'Content-Type': result.mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': result.size.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } catch (error) {
      console.error('Export error:', error)
      return new Response(
        JSON.stringify({
          error: 'Export failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  },
]

export const onRequestPost: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    try {
      const userId = context.data.user_id
      const body = (await context.request.json()) as ExportPreviewRequest

      const requestedFormat = body.format ?? 'json'
      if (requestedFormat !== 'json') {
        return new Response(
          JSON.stringify({
            error: 'Unsupported export format',
            message: `Unsupported export format: ${requestedFormat}`,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const scope = parseExportScope(body.scope)
      const includeDeleted = Boolean(body.include_deleted)

      const stats = await getExportStats(context.env.DB, userId, scope, includeDeleted)
      const estimatedSize = estimateExportSize(stats)
      const estimatedFilename = getExportFilename(new Date().toISOString(), scope)

      return new Response(
        JSON.stringify({
          stats,
          estimated_size: estimatedSize,
          format: 'json',
          estimated_filename: estimatedFilename,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Export preview error:', error)
      return new Response(JSON.stringify({ error: 'Failed to get export preview' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
]
