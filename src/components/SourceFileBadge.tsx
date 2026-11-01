import { useLocation } from 'react-router'

const SOURCE_FILES: { pattern: RegExp; file: string }[] = [
  { pattern: /^\/$/, file: 'src/pages/PortalPage.tsx' },
  { pattern: /^\/admin$/, file: 'src/pages/AdminProjectListPage.tsx' },
  {
    pattern: /^\/admin\/projects\/[^/]+\/members\/[^/]+$/,
    file: 'src/pages/MyKpiPage.tsx',
  },
  { pattern: /^\/admin\/projects\/[^/]+$/, file: 'src/pages/MemberListPage.tsx' },
  { pattern: /^\/employee$/, file: 'src/pages/EmployeeHomePage.tsx' },
  { pattern: /^\/employee\/projects\/[^/]+$/, file: 'src/pages/MyKpiPage.tsx' },
  { pattern: /^\/reviewer$/, file: 'src/pages/ReviewerHomePage.tsx' },
  {
    pattern: /^\/reviewer\/projects\/[^/]+\/members\/[^/]+$/,
    file: 'src/pages/MyKpiPage.tsx',
  },
  {
    pattern: /^\/reviewer\/projects\/[^/]+$/,
    file: 'src/pages/MemberListPage.tsx',
  },
]

export function SourceFileBadge() {
  const { pathname } = useLocation()
  const normalized = pathname.replace(/\/$/, '') || '/'
  const file =
    SOURCE_FILES.find((item) => item.pattern.test(normalized))?.file ??
    'src/App.tsx'

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] text-slate-400 shadow-sm">
      本页文件：<span className="font-mono text-slate-500">{file}</span>
    </div>
  )
}
