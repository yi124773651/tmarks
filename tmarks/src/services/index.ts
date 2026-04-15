// ============ Services Exports ============

export * from './api-keys';
export * from './auth';
export * from './bookmarks';
export * from './preferences';
export * from './share';
export * from './storage';
export * from './tab-groups';
export * from './tags';

/**
 * Assert response data exists, throw descriptive error instead of runtime crash
 */
export function assertData<T>(data: T | undefined, context: string): T {
  if (data === undefined || data === null) {
    throw new Error(`Unexpected empty response from ${context}`)
  }
  return data
}
