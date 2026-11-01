import { Navigate, Route, Routes } from 'react-router'
import type { ReactNode } from 'react'
import { AppLayout } from './components/AppLayout'
import { useAppStore } from './store/AppStore'
import { ROLE_HOME } from './lib/roles'
import type { Role } from './types'
import { EntryPage } from './pages/EntryPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ParticipantsPage } from './pages/ParticipantsPage'
import { MyKpiPage } from './pages/MyKpiPage'

function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { role } = useAppStore()
  if (!role) return <Navigate to="/" replace />
  if (!allow.includes(role)) return <Navigate to={ROLE_HOME[role]} replace />
  return <>{children}</>
}

const App = () => (
  <Routes>
    <Route path="/" element={<EntryPage />} />
    <Route element={<AppLayout />}>
      <Route
        path="/projects"
        element={
          <RoleGuard allow={['admin']}>
            <ProjectsPage />
          </RoleGuard>
        }
      />
      <Route
        path="/people"
        element={
          <RoleGuard allow={['admin', 'reviewer']}>
            <ParticipantsPage />
          </RoleGuard>
        }
      />
      <Route
        path="/people/:projectId"
        element={
          <RoleGuard allow={['admin', 'reviewer']}>
            <ParticipantsPage />
          </RoleGuard>
        }
      />
      <Route
        path="/my-kpi"
        element={
          <RoleGuard allow={['admin', 'reviewer', 'employee']}>
            <MyKpiPage />
          </RoleGuard>
        }
      />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default App
