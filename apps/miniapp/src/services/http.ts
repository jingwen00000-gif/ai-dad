import Taro from '@tarojs/taro'
import { clearTokens, getTokens, setTokens, StoredTokens } from './token-store'

const API_BASE = process.env.TARO_APP_API_BASE

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

interface TokenPair extends StoredTokens {
  accessTokenExpiresIn: number
  refreshTokenExpiresIn: number
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** 后端错误体：{ message: string | string[] } → 给用户看的一句话 */
function errorMessage(data: any, status: number): string {
  const m = data?.message
  if (Array.isArray(m)) return m[0]
  if (typeof m === 'string') return m
  return status >= 500 ? '服务器开小差了，请稍后再试' : `请求失败（${status}）`
}

async function rawRequest<T>(method: Method, path: string, data?: unknown, token?: string): Promise<T> {
  let res: Taro.request.SuccessCallbackResult<any>
  try {
    res = await Taro.request({
      url: `${API_BASE}${path}`,
      method,
      data: data as any,
      header: {
        'content-type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 15000,
    })
  } catch {
    throw new ApiError(0, '网络不太好，请检查网络后重试')
  }
  if (res.statusCode >= 200 && res.statusCode < 300) return res.data as T
  throw new ApiError(res.statusCode, errorMessage(res.data, res.statusCode))
}

/** 微信登录拿 code。H5 预览时没有 wx.login，用本机固定的开发 code（仅后端开启 WX_MOCK_LOGIN 时可用） */
async function getLoginCode(): Promise<string> {
  if (process.env.TARO_ENV === 'h5') {
    let id = Taro.getStorageSync('h5_dev_id')
    if (!id) {
      id = `h5dev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
      Taro.setStorageSync('h5_dev_id', id)
    }
    return id
  }
  const { code } = await Taro.login()
  if (!code) throw new ApiError(0, '微信登录失败，请重试')
  return code
}

let loginInFlight: Promise<void> | null = null
let refreshInFlight: Promise<boolean> | null = null

/** 静默登录。并发调用只会真正登录一次 */
export function login(): Promise<void> {
  if (!loginInFlight) {
    loginInFlight = (async () => {
      const code = await getLoginCode()
      const tokens = await rawRequest<TokenPair>('POST', '/auth/wx-login', { code })
      setTokens(tokens)
    })().finally(() => {
      loginInFlight = null
    })
  }
  return loginInFlight
}

/** 用 refresh token 换新的一对 token。失败返回 false（之后走重新登录） */
function refresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const current = getTokens()
      if (!current) return false
      try {
        setTokens(await rawRequest<TokenPair>('POST', '/auth/refresh', { refreshToken: current.refreshToken }))
        return true
      } catch {
        clearTokens()
        return false
      }
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/**
 * 带登录态的请求：
 * 没有 token → 先登录；401 → 刷新 token 重试；刷新也失败 → 重新登录再试一次。
 */
export async function api<T>(method: Method, path: string, data?: unknown): Promise<T> {
  if (!getTokens()) await login()
  try {
    return await rawRequest<T>(method, path, data, getTokens()?.accessToken)
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err
  }
  if (!(await refresh())) await login()
  return rawRequest<T>(method, path, data, getTokens()?.accessToken)
}
