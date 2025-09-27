import { Link } from 'react-router-dom'

export default function AuthScaffold({
  heading,
  subheading,
  children,
  footer,
  maxWidth = 'max-w-md',
  cardClassName = 'p-1',
  containerClassName = '',
  showHomeLink = true,
  homeHref = '/',
  homeLabel = 'Back to homepage',
}) {
  const containerClasses = ['w-full', maxWidth, containerClassName].filter(Boolean).join(' ')
  const cardClasses = [
    'rounded-2xl border border-crystal-border/15 bg-quantum-overlay/80 shadow-glow-blue backdrop-blur',
    cardClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-quantum px-4 py-12">
      <div className={containerClasses}>
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-xl font-bold text-quantum-space shadow-glow-blue">
              S
            </div>
            <h1 className="text-lg font-semibold text-crystal-pure">Sentia Manufacturing</h1>
          </Link>
          <h2 className="text-2xl font-bold text-crystal-pure">{heading}</h2>
          {subheading ? <p className="mt-2 text-sm text-crystal-border/80">{subheading}</p> : null}
        </div>

        <div className={cardClasses}>{children}</div>

        {footer ? <div className="mt-6 text-center text-sm text-crystal-border/80">{footer}</div> : null}

        {showHomeLink ? (
          <div className="mt-8 text-center">
            <Link to={homeHref} className="text-sm text-crystal-border/70 transition hover:text-crystal-pure">
              {homeLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
