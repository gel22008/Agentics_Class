import type { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  /** Optional short line under the title. */
  subtitle?: string
  children?: ReactNode
  /** Narrow pages (forms, cards) read better at a smaller max width. */
  width?: 'narrow' | 'wide'
}

/** Reusable page wrapper with a consistent title, spacing and max width. */
function PageContainer({ title, subtitle, children, width = 'wide' }: PageContainerProps) {
  return (
    <section className={`page page--${width}`} aria-labelledby="page-title">
      <header className="page__header">
        <h1 id="page-title" className="page__title">
          {title}
        </h1>
        {subtitle && <p className="page__subtitle">{subtitle}</p>}
      </header>
      {children}
    </section>
  )
}

export default PageContainer
