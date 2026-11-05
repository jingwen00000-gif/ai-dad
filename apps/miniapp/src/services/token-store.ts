import Taro from '@tarojs/taro'

const KEY = 'auth_tokens'

export interface StoredTokens {
  accessToken: string
  refreshToken: string
}

export function getTokens(): StoredTokens | null {
  try {
    const value = Taro.getStorageSync(KEY)
    return value && value.accessToken ? (value as StoredTokens) : null
  } catch {
    return null
  }
}

export function setTokens(tokens: StoredTokens): void {
  Taro.setStorageSync(KEY, { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
}

export function clearTokens(): void {
  Taro.removeStorageSync(KEY)
}
