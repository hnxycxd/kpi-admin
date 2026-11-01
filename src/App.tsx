import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { AppProvider, useStore } from './store'
import AppHeader from './components/AppHeader'
import HomePage from './pages/HomePage'
import ProjectManagePage from './pages/ProjectManagePage'
import ParticipantListPage from './pages/ParticipantListPage'
import ReviewerProjectsPage from './pages/ReviewerProjectsPage'
import MyKpiPage from './pages/MyKpiPage'
import type { Role } from './types'

function RequireRole({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { currentUser } = useStore()
  if (!currentUser) return <Navigate to="/" replace />
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function Shell() {
  const location = useLocation()
  return (
    <div className="min-h-screen bg-gray-50">
      {location.pathname !== '/' && <AppHeader />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/admin"
          element={
            <RequireRole roles={['admin']}>
              <ProjectManagePage />
            </RequireRole>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <RequireRole roles={['admin', 'reviewer']}>
              <ParticipantListPage />
            </RequireRole>
          }
        />
        <Route
          path="/reviewer"
          element={
            <RequireRole roles={['reviewer']}>
              <ReviewerProjectsPage />
            </RequireRole>
          }
        />
        <Route
          path="/my-kpi/:projectId/:participantId"
          element={
            <RequireRole>
              <MyKpiPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <BrowserRouter>
          <AppProvider>
            <Shell />
          </AppProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  )
}
