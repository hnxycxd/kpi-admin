import type { KpiItem } from '../types'

export function KpiListCell({ kpis }: { kpis: KpiItem[] }) {
  const hasContent = kpis.some(
    (item) => item.name || item.baseTarget || item.challengeTarget,
  )

  if (!hasContent) return '-'

  return (
    <div className="max-w-[360px] space-y-1.5">
      {kpis.map((item) => (
        <div
          key={item.id}
          className="rounded-md border border-slate-100 bg-slate-50/80 px-2.5 py-1.5"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[13px] font-medium text-slate-700">
              {item.name || '未命名指标'}
            </span>
            <span className="shrink-0 text-xs font-semibold text-blue-600">
              {item.weight}%
            </span>
          </div>
          <div className="mt-0.5 truncate text-[11px] text-slate-500">
            基本：{item.baseTarget || '—'} · 挑战：{item.challengeTarget || '—'}
          </div>
        </div>
      ))}
    </div>
  )
}
