/**
 * API Key Logger - 
 * ，�? */

interface LogEntry {
  api_key_id: string
  user_id: string
  endpoint: string
  method: string
  status: number
  ip: string | null
}

/**
 *  API Key 
 * @param entry 
 * @param db D1 Database
 */
export async function logApiKeyUsage(entry: LogEntry, db: D1Database): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO api_key_logs (api_key_id, user_id, endpoint, method, status, ip)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        entry.api_key_id,
        entry.user_id,
        entry.endpoint,
        entry.method,
        entry.status,
        entry.ip
      )
      .run()

    // （ Key �?100 ）
    await cleanupOldLogs(entry.api_key_id, db)
  } catch (error) {
    // ，
    console.error('Failed to log API key usage:', error)
  }
}

/**
 * ，�?100 �? * @param apiKeyId API Key ID
 * @param db D1 Database
 */
async function cleanupOldLogs(apiKeyId: string, db: D1Database): Promise<void> {
  try {
    //  100 �?    await db
      .prepare(
        `DELETE FROM api_key_logs
         WHERE api_key_id = ?
         AND id NOT IN (
           SELECT id FROM api_key_logs
           WHERE api_key_id = ?
           ORDER BY created_at DESC
           LIMIT 100
         )`
      )
      .bind(apiKeyId, apiKeyId)
      .run()
  } catch (error) {
    console.error('Failed to cleanup old logs:', error)
  }
}

/**
 *  API Key 
 * @param apiKeyId API Key ID
 * @param limit （�?10�? * @param db D1 Database
 * @returns 
 */
export async function getApiKeyLogs(
  apiKeyId: string,
  db: D1Database,
  limit: number = 10
): Promise<LogEntry[]> {
  const result = await db
    .prepare(
      `SELECT api_key_id, user_id, endpoint, method, status, ip, created_at
       FROM api_key_logs
       WHERE api_key_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .bind(apiKeyId, limit)
    .all()

  return result.results as unknown as LogEntry[]
}

/**
 *  API Key 
 * @param apiKeyId API Key ID
 * @param db D1 Database
 * @returns 
 */
export async function getApiKeyStats(
  apiKeyId: string,
  db: D1Database
): Promise<{
  total_requests: number
  last_used_at: string | null
  last_used_ip: string | null
}> {
  const result = await db
    .prepare(
      `SELECT
         COUNT(*) as total_requests,
         MAX(created_at) as last_used_at,
         (SELECT ip FROM api_key_logs
          WHERE api_key_id = ?
          ORDER BY created_at DESC
          LIMIT 1) as last_used_ip
       FROM api_key_logs
       WHERE api_key_id = ?`
    )
    .bind(apiKeyId, apiKeyId)
    .first()

  return result as unknown as {
    total_requests: number
    last_used_at: string | null
    last_used_ip: string | null
  }
}
