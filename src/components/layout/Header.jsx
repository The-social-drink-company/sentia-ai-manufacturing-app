const Header = ({ title, subtitle }) => (
  <header className="border-b border-border bg-card px-6 py-4">
    <h1 className="text-xl font-semibold">{title || 'Dashboard'}</h1>
    {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
  </header>
)

export default Header
