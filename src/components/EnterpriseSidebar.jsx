const NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    links: [
      { label: 'Executive Dashboard', path: '/dashboard' }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    links: [
      { label: 'Working Capital', path: '/working-capital' },
      { label: 'Inventory', path: '/inventory' },
      { label: 'Production', path: '/production' }
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    links: [
      { label: 'Settings', path: '/settings', roles: ['admin', 'superadmin'] }
    ]
  }
]

const userCanAccess = (link, role) => {
  if (!link.roles || link.roles.length === 0) {
    return true
  }

  return link.roles.includes(role)
}

const EnterpriseSidebar = ({ currentPath, userRole, onNavigate, footerContent }) => {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-200">
      <div className="border-b border-slate-800 p-6">
        <h2 className="text-lg font-semibold">Sentia Console</h2>
        <p className="mt-1 text-sm text-slate-400">Operational intelligence</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <li key={section.id}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {section.label}
              </p>
              <ul className="space-y-1">
                {section.links
                  .filter((link) => userCanAccess(link, userRole))
                  .map((link) => {
                    const isActive = currentPath.startsWith(link.path)

                    return (
                      <li key={link.path}>
                        <button
                          type="button"
                          onClick={() => onNavigate(link.path)}
                          className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition hover:bg-slate-800 ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`}
                        >
                          <span>{link.label}</span>
                          {isActive ? <span className="text-xs text-cyan-400">Live</span> : null}
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      {footerContent ? <div className="border-t border-slate-800 p-4">{footerContent}</div> : null}
    </aside>
  )
}

export default EnterpriseSidebar
