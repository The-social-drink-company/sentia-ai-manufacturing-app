import SSEStatusIndicator from './SSEStatusIndicator'

const Header = ({
  title,
  subtitle,
  showStatus = true,
  statusChannel = 'dashboard',
}) => (
  <header className="border-b border-border bg-card px-6 py-4">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold">{title || 'Dashboard'}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {showStatus ? (
        <SSEStatusIndicator channel={statusChannel} className="mt-2 sm:mt-0" />
      ) : null}
    </div>
  </header>
)

export default Header
