import { App as AntApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { RoleLayout } from './components/RoleLayout'
import AdminProjectListPage from './pages/AdminProjectListPage'
import EmployeeHomePage from './pages/EmployeeHomePage'
import MemberListPage from './pages/MemberListPage'
import MyKpiPage from './pages/MyKpiPage'
import PortalPage from './pages/PortalPage'
import ReviewerHomePage from './pages/ReviewerHomePage'
import { KpiProvider } from './store/KpiStore'

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 8,
          colorText: '#1e293b',
          colorTextSecondary: '#64748b',
          colorBgLayout: '#f8fafc',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        },
        components: {
          Button: {
            fontWeight: 500,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            headerSplitColor: '#e2e8f0',
            rowHoverBg: '#f8fbff',
          },
          Modal: {
            titleFontSize: 16,
          },
        },
      }}
    >
      <AntApp>
        <KpiProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PortalPage />} />

              <Route element={<RoleLayout role="admin" />}>
                <Route path="/admin" element={<AdminProjectListPage />} />
                <Route
                  path="/admin/projects/:projectId"
                  element={<MemberListPage role="admin" />}
                />
                <Route
                  path="/admin/projects/:projectId/members/:memberId"
                  element={<MyKpiPage role="admin" />}
                />
              </Route>

              <Route element={<RoleLayout role="employee" />}>
                <Route path="/employee" element={<EmployeeHomePage />} />
                <Route
                  path="/employee/projects/:projectId"
                  element={<MyKpiPage role="employee" />}
                />
              </Route>

              <Route element={<RoleLayout role="reviewer" />}>
                <Route path="/reviewer" element={<ReviewerHomePage />} />
                <Route
                  path="/reviewer/projects/:projectId"
                  element={<MemberListPage role="reviewer" />}
                />
                <Route
                  path="/reviewer/projects/:projectId/members/:memberId"
                  element={<MyKpiPage role="reviewer" />}
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </KpiProvider>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
