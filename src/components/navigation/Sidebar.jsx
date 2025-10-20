import { NavLink } from 'react-router-dom'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/working-capital', label: 'Working Capital' },
  { to: '/what-if', label: 'What-If Analysis' },
  { to: '/admin', label: 'Admin' },
]

const linkClasses = ({ isActive }) =>
  [
    'block rounded-xl border px-3 py-2 text-sm font-medium text-crystal-border/80 transition-colors duration-150',
    'hover:bg-quantum-hover/60 hover:text-crystal-pure focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400',
    isActive
      ? 'border-crystal-border/20 bg-quantum-overlay/80 text-crystal-pure shadow-inner'
      : 'border-transparent',
  ].join(' ')

export default function Sidebar() {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-4">
      <div className="text-[0.7rem] uppercase tracking-[0.3em] text-crystal-border/60">
        CapLiquify Navigation
      </div>
      <ul className="space-y-1">
        {navigationItems.map(item => (
          <li key={item.to}>
            <NavLink to={item.to} className={linkClasses} end>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
