import { NavLink } from 'react-router-dom'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/working-capital', label: 'Working Capital' },
  { to: '/what-if', label: 'What-If Analysis' },
  { to: '/admin', label: 'Admin' },
]

const linkClasses = ({ isActive }) =>
  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`.trim()

export default function Sidebar() {
  return (
    <nav aria-label="Primary" className="sidebar">
      <div className="sidebar__section-label">Sentia Navigation</div>
      <ul className="sidebar__list">
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
