import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

interface NavItem {
  path: string
  label: string
  icon: string
}

interface Props {
  items: NavItem[]
  roleLabel: string
  roleColor: string
}

export default function Sidebar({ items, roleLabel, roleColor }: Props) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">VRP</div>
        {!collapsed && (
          <div className="sidebar__brand-text">
            <p className="sidebar__brand-name">Hinduja Renewables</p>
            <p className="sidebar__brand-sub">Vendor Portal</p>
          </div>
        )}
        <button className="sidebar__toggle" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="sidebar__role-badge" style={{ background: roleColor }}>
          {roleLabel.toUpperCase()}
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar__nav">
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar__footer">
        {!collapsed && (
          <div className="sidebar__user">
            <div className="sidebar__avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{user?.name}</p>
              <p className="sidebar__user-role">{user?.role}</p>
            </div>
          </div>
        )}
        <button className="sidebar__logout" onClick={handleLogout} title="Logout">
          🚪{!collapsed && <span> Logout</span>}
        </button>
      </div>
    </aside>
  )
}
