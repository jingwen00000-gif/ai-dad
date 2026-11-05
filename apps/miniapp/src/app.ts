import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { login } from './services/http'
import { getTokens } from './services/token-store'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    // 启动即静默登录；失败不打断，页面请求时会自动重试
    if (!getTokens()) login().catch(() => undefined)
  })

  return children
}

export default App
