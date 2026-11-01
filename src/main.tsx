import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntApp, ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { AppStoreProvider } from './store/AppStore'

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#17624b',
    colorInfo: '#2f5f80',
    colorSuccess: '#1f6a4e',
    colorWarning: '#a96f1f',
    colorError: '#a64932',
    colorText: '#1b251f',
    colorTextSecondary: '#6d766e',
    colorBorder: '#e2ded2',
    colorBorderSecondary: '#edeae1',
    colorBgLayout: '#f4f2ec',
    colorBgContainer: '#fffefb',
    colorBgElevated: '#fffefb',
    borderRadius: 8,
    borderRadiusLG: 12,
    controlHeight: 34,
    fontSize: 13,
    fontFamily:
      '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif',
  },
  components: {
    Table: {
      headerBg: '#faf8f2',
      headerColor: '#566057',
      rowHoverBg: '#faf8f2',
      borderColor: '#ece8de',
      headerSplitColor: 'transparent',
    },
    Button: {
      primaryShadow: 'none',
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntApp message={{ top: 76, duration: 4.5, maxCount: 3 }}>
        <BrowserRouter>
          <AppStoreProvider>
            <App />
          </AppStoreProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
