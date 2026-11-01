import type { ReactNode } from 'react'

interface PageHeadingProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeading({ eyebrow, title, description, actions }: PageHeadingProps) {
  return (
    <div className="page-head">
      <div className="page-head-copy">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        {description ? <div className="page-desc">{description}</div> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  )
}
