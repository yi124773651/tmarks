/**
 * 应用配置常量
 * 将原本在 wrangler.toml [vars] 中的配置移到代码中
 */

export const APP_CONFIG = {
  /**
   * 应用环境
   */
  ENVIRONMENT: 'development' as 'development' | 'production',

  /**
   * JWT 访问令牌过期时间
   */
  JWT_ACCESS_TOKEN_EXPIRES_IN: '365d',

  /**
   * JWT 刷新令牌过期时间
   */
  JWT_REFRESH_TOKEN_EXPIRES_IN: '365d',

  /**
   * 是否允许用户注册
   */
  ALLOW_REGISTRATION: true,
} as const

/**
 * 获取配置值的辅助函数
 */
export function getConfig() {
  return APP_CONFIG
}

/**
 * 检查是否允许注册
 */
export function isRegistrationAllowed(): boolean {
  return APP_CONFIG.ALLOW_REGISTRATION
}

/**
 * 获取 JWT 访问令牌过期时间
 */
export function getJwtAccessTokenExpiresIn(): string {
  return APP_CONFIG.JWT_ACCESS_TOKEN_EXPIRES_IN
}

/**
 * 获取 JWT 刷新令牌过期时间
 */
export function getJwtRefreshTokenExpiresIn(): string {
  return APP_CONFIG.JWT_REFRESH_TOKEN_EXPIRES_IN
}

/**
 * 获取当前环境
 */
export function getEnvironment(): 'development' | 'production' {
  return APP_CONFIG.ENVIRONMENT
}
