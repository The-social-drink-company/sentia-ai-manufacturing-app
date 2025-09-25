import PropTypes from 'prop-types'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'settings', label: 'Settings', href: '/settings' }
]

const EnterpriseSidebar = ({ currentPath, userRole, onNavigate, footerContent }) => {
  return (
    <aside className='flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur'>
      <div className='px-6 py-5'>
        <div className='text-sm font-semibold uppercase tracking-wide text-slate-400'>Sentia Manufacturing</div>
        <div className='mt-2 text-xl font-bold text-white'>Operations Hub</div>
        <div className='mt-1 text-xs text-slate-500'>Signed in as {userRole || 'guest'}</div>
      </div>

      <nav className='flex-1 space-y-1 px-3'>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath?.startsWith(item.href)
          const baseClasses = 'w-full rounded-lg px-3 py-2 text-left text-sm transition'
          const stateClasses = isActive ? ' bg-slate-800 text-white' : ' text-slate-300 hover:bg-slate-800 hover:text-white'

          return (
            <button
              key={item.id}
              type='button'
              onClick={() => onNavigate?.(item.href)}
              className={baseClasses + stateClasses}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      {footerContent ? (
        <div className='border-t border-slate-800 px-3 py-4 text-xs text-slate-400'>{footerContent}</div>
      ) : null}
    </aside>
  )
}

EnterpriseSidebar.propTypes = {
  currentPath: PropTypes.string,
  userRole: PropTypes.string,
  onNavigate: PropTypes.func,
  footerContent: PropTypes.node
}

EnterpriseSidebar.defaultProps = {
  currentPath: '/',
  userRole: 'guest',
  onNavigate: undefined,
  footerContent: null
}

export default EnterpriseSidebar