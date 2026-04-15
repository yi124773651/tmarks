/**
 * 权限系统 - 前后端共享
 * 定义所有 API Key 权限常量和工具函数
 */

/**
 * 权限常量
 */
export const PERMISSIONS = {
  // 书签权限
  BOOKMARKS_CREATE: 'bookmarks.create',
  BOOKMARKS_READ: 'bookmarks.read',
  BOOKMARKS_UPDATE: 'bookmarks.update',
  BOOKMARKS_DELETE: 'bookmarks.delete',
  BOOKMARKS_ALL: 'bookmarks.*',

  // 标签权限
  TAGS_CREATE: 'tags.create',
  TAGS_READ: 'tags.read',
  TAGS_UPDATE: 'tags.update',
  TAGS_DELETE: 'tags.delete',
  TAGS_ASSIGN: 'tags.assign',
  TAGS_ALL: 'tags.*',

  // 收纳（标签页组）权限
  TAB_GROUPS_CREATE: 'tab_groups.create',
  TAB_GROUPS_READ: 'tab_groups.read',
  TAB_GROUPS_UPDATE: 'tab_groups.update',
  TAB_GROUPS_DELETE: 'tab_groups.delete',
  TAB_GROUPS_ALL: 'tab_groups.*',

  // AI 权限
  AI_SUGGEST: 'ai.suggest',

  // 用户权限
  USER_READ: 'user.read',
  USER_PREFERENCES_READ: 'user.preferences.read',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

/**
 * 权限模板 - 使用 i18n key
 */
export const PERMISSION_TEMPLATES = {
  READ_ONLY: {
    nameKey: 'settings:permissions.templates.readOnly',
    descriptionKey: 'settings:permissions.templates.readOnlyDesc',
    permissions: [
      PERMISSIONS.BOOKMARKS_READ,
      PERMISSIONS.TAGS_READ,
      PERMISSIONS.USER_READ,
    ] as string[],
  },

  BASIC: {
    nameKey: 'settings:permissions.templates.basic',
    descriptionKey: 'settings:permissions.templates.basicDesc',
    permissions: [
      PERMISSIONS.BOOKMARKS_CREATE,
      PERMISSIONS.BOOKMARKS_READ,
      PERMISSIONS.TAGS_CREATE,
      PERMISSIONS.TAGS_READ,
      PERMISSIONS.TAGS_ASSIGN,
      PERMISSIONS.USER_READ,
    ] as string[],
  },

  FULL: {
    nameKey: 'settings:permissions.templates.full',
    descriptionKey: 'settings:permissions.templates.fullDesc',
    permissions: [
      PERMISSIONS.BOOKMARKS_ALL,
      PERMISSIONS.TAGS_ALL,
      PERMISSIONS.TAB_GROUPS_ALL,
      PERMISSIONS.AI_SUGGEST,
      PERMISSIONS.USER_READ,
    ] as string[],
  },
} as const

export type PermissionTemplate = keyof typeof PERMISSION_TEMPLATES

/**
 * 检查是否有权限
 * @param userPermissions 用户拥有的权限列表
 * @param requiredPermission 需要的权限
 * @returns 是否有权限
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.some(p => {
    // 完全匹配
    if (p === requiredPermission) return true

    // 通配符匹配：bookmarks.* 匹配 bookmarks.create
    if (p.endsWith('.*')) {
      const prefix = p.slice(0, -2)
      return requiredPermission.startsWith(prefix + '.')
    }

    return false
  })
}

/**
 * 权限到 i18n key 的映射
 */
const PERMISSION_I18N_KEYS: Record<string, string> = {
  'bookmarks.create': 'settings:permissions.bookmarksCreate',
  'bookmarks.read': 'settings:permissions.bookmarksRead',
  'bookmarks.update': 'settings:permissions.bookmarksUpdate',
  'bookmarks.delete': 'settings:permissions.bookmarksDelete',
  'bookmarks.*': 'settings:permissions.bookmarksAll',
  'tags.create': 'settings:permissions.tagsCreate',
  'tags.read': 'settings:permissions.tagsRead',
  'tags.update': 'settings:permissions.tagsUpdate',
  'tags.delete': 'settings:permissions.tagsDelete',
  'tags.assign': 'settings:permissions.tagsAssign',
  'tags.*': 'settings:permissions.tagsAll',
  'tab_groups.create': 'settings:permissions.tabGroupsCreate',
  'tab_groups.read': 'settings:permissions.tabGroupsRead',
  'tab_groups.update': 'settings:permissions.tabGroupsUpdate',
  'tab_groups.delete': 'settings:permissions.tabGroupsDelete',
  'tab_groups.*': 'settings:permissions.tabGroupsAll',
  'ai.suggest': 'settings:permissions.aiSuggest',
  'user.read': 'settings:permissions.userRead',
  'user.preferences.read': 'settings:permissions.userPreferencesRead',
}

/**
 * 获取权限的 i18n key
 * @param permission 权限字符串
 * @returns i18n key
 */
export function getPermissionI18nKey(permission: string): string {
  return PERMISSION_I18N_KEYS[permission] || permission
}

/**
 * 获取权限的显示名称（需要传入翻译函数）
 * @param permission 权限字符串
 * @param t 翻译函数
 * @returns 显示名称
 */
export function getPermissionLabel(permission: string, t?: (key: string) => string): string {
  const key = PERMISSION_I18N_KEYS[permission]
  if (t && key) {
    return t(key)
  }
  // 后备：返回权限字符串本身
  return permission
}

/**
 * 权限分组的 i18n key
 */
const PERMISSION_GROUP_I18N_KEYS = {
  bookmarks: 'settings:permissions.bookmarks',
  tags: 'settings:permissions.tags',
  tabGroups: 'settings:permissions.tabGroups',
  other: 'settings:permissions.other',
}

/**
 * 获取权限的分组（需要传入翻译函数）
 */
export function getPermissionGroups(t?: (key: string) => string): Array<{
  name: string
  nameKey: string
  permissions: Array<{ value: string; label: string; labelKey: string }>
}> {
  const getName = (key: string) => t ? t(key) : key
  const getLabel = (permission: string) => {
    const labelKey = getPermissionI18nKey(permission)
    return t ? t(labelKey) : permission
  }

  return [
    {
      name: getName(PERMISSION_GROUP_I18N_KEYS.bookmarks),
      nameKey: PERMISSION_GROUP_I18N_KEYS.bookmarks,
      permissions: [
        { value: PERMISSIONS.BOOKMARKS_CREATE, label: getLabel(PERMISSIONS.BOOKMARKS_CREATE), labelKey: getPermissionI18nKey(PERMISSIONS.BOOKMARKS_CREATE) },
        { value: PERMISSIONS.BOOKMARKS_READ, label: getLabel(PERMISSIONS.BOOKMARKS_READ), labelKey: getPermissionI18nKey(PERMISSIONS.BOOKMARKS_READ) },
        { value: PERMISSIONS.BOOKMARKS_UPDATE, label: getLabel(PERMISSIONS.BOOKMARKS_UPDATE), labelKey: getPermissionI18nKey(PERMISSIONS.BOOKMARKS_UPDATE) },
        { value: PERMISSIONS.BOOKMARKS_DELETE, label: getLabel(PERMISSIONS.BOOKMARKS_DELETE), labelKey: getPermissionI18nKey(PERMISSIONS.BOOKMARKS_DELETE) },
      ],
    },
    {
      name: getName(PERMISSION_GROUP_I18N_KEYS.tags),
      nameKey: PERMISSION_GROUP_I18N_KEYS.tags,
      permissions: [
        { value: PERMISSIONS.TAGS_CREATE, label: getLabel(PERMISSIONS.TAGS_CREATE), labelKey: getPermissionI18nKey(PERMISSIONS.TAGS_CREATE) },
        { value: PERMISSIONS.TAGS_READ, label: getLabel(PERMISSIONS.TAGS_READ), labelKey: getPermissionI18nKey(PERMISSIONS.TAGS_READ) },
        { value: PERMISSIONS.TAGS_UPDATE, label: getLabel(PERMISSIONS.TAGS_UPDATE), labelKey: getPermissionI18nKey(PERMISSIONS.TAGS_UPDATE) },
        { value: PERMISSIONS.TAGS_DELETE, label: getLabel(PERMISSIONS.TAGS_DELETE), labelKey: getPermissionI18nKey(PERMISSIONS.TAGS_DELETE) },
        { value: PERMISSIONS.TAGS_ASSIGN, label: getLabel(PERMISSIONS.TAGS_ASSIGN), labelKey: getPermissionI18nKey(PERMISSIONS.TAGS_ASSIGN) },
      ],
    },
    {
      name: getName(PERMISSION_GROUP_I18N_KEYS.tabGroups),
      nameKey: PERMISSION_GROUP_I18N_KEYS.tabGroups,
      permissions: [
        { value: PERMISSIONS.TAB_GROUPS_CREATE, label: getLabel(PERMISSIONS.TAB_GROUPS_CREATE), labelKey: getPermissionI18nKey(PERMISSIONS.TAB_GROUPS_CREATE) },
        { value: PERMISSIONS.TAB_GROUPS_READ, label: getLabel(PERMISSIONS.TAB_GROUPS_READ), labelKey: getPermissionI18nKey(PERMISSIONS.TAB_GROUPS_READ) },
        { value: PERMISSIONS.TAB_GROUPS_UPDATE, label: getLabel(PERMISSIONS.TAB_GROUPS_UPDATE), labelKey: getPermissionI18nKey(PERMISSIONS.TAB_GROUPS_UPDATE) },
        { value: PERMISSIONS.TAB_GROUPS_DELETE, label: getLabel(PERMISSIONS.TAB_GROUPS_DELETE), labelKey: getPermissionI18nKey(PERMISSIONS.TAB_GROUPS_DELETE) },
      ],
    },
    {
      name: getName(PERMISSION_GROUP_I18N_KEYS.other),
      nameKey: PERMISSION_GROUP_I18N_KEYS.other,
      permissions: [
        { value: PERMISSIONS.AI_SUGGEST, label: getLabel(PERMISSIONS.AI_SUGGEST), labelKey: getPermissionI18nKey(PERMISSIONS.AI_SUGGEST) },
        { value: PERMISSIONS.USER_READ, label: getLabel(PERMISSIONS.USER_READ), labelKey: getPermissionI18nKey(PERMISSIONS.USER_READ) },
      ],
    },
  ]
}
