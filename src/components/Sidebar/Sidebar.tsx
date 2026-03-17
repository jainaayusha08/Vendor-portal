import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import FormField from '../FormField/FormField'
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
  const { user, logout, updateUser } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileClosing, setProfileClosing] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' })
  const cancelRef = useRef<HTMLButtonElement | null>(null)
  const profileTimerRef = useRef<number | null>(null)
  const navigate = useNavigate()

  const ICONS: Record<string, JSX.Element> = {
    dashboard: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
    register: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h10a1 1 0 0 1 1 1v4" />
        <path d="M4 20h10a1 1 0 0 0 1-1v-4" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    ),
    history: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h10" />
      </svg>
    ),
    status: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
    ),
    create: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 12h12" />
        <path d="M12 6v12" />
        <path d="M4 19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9H4z" />
      </svg>
    ),
    vendors: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 11a4 4 0 1 0-8 0" />
        <path d="M3 20a5 5 0 0 1 10 0" />
        <path d="M17 16a4 4 0 0 1 4 4" />
        <circle cx="17" cy="7" r="3" />
      </svg>
    ),
    self: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <circle cx="12" cy="9" r="2.5" />
        <path d="M8 16h8" />
      </svg>
    ),
    approvers: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="7" cy="7" r="3" />
        <circle cx="17" cy="7" r="3" />
        <path d="M7 10v4" />
        <path d="M17 10v4" />
        <path d="M4 18h16" />
      </svg>
    ),
    requests: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h16v10a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
        <path d="M4 10h16" />
      </svg>
    ),
    workflow: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h10" />
        <path d="M4 12h16" />
        <path d="M4 18h12" />
        <circle cx="17" cy="6" r="2" />
        <circle cx="9" cy="18" r="2" />
      </svg>
    ),
    export: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v12" />
        <path d="M8 7l4-4 4 4" />
        <path d="M4 21h16" />
      </svg>
    ),
    import: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21V9" />
        <path d="M8 17l4 4 4-4" />
        <path d="M4 3h16" />
      </svg>
    ),
    vendorsAdmin: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 21V9l9-5 9 5v12" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  }

  const renderIcon = (icon: string) => {
    const svg = ICONS[icon]
    return svg ? svg : <span>{icon}</span>
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const openProfile = () => {
    if (profileTimerRef.current) window.clearTimeout(profileTimerRef.current)
    setProfileForm({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' })
    setEditingProfile(false)
    setProfileClosing(false)
    setShowProfile(true)
  }

  const closeProfile = () => {
    setProfileClosing(true)
    if (profileTimerRef.current) window.clearTimeout(profileTimerRef.current)
    profileTimerRef.current = window.setTimeout(() => {
      setShowProfile(false)
      setProfileClosing(false)
    }, 160)
  }

  const handleProfileSave = () => {
    updateUser(profileForm)
    setEditingProfile(false)
  }

  useEffect(() => {
    if (!showLogout) return
    cancelRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowLogout(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showLogout])

  useEffect(() => {
    if (!showProfile) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeProfile()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showProfile])

  useEffect(() => {
    return () => {
      if (profileTimerRef.current) window.clearTimeout(profileTimerRef.current)
    }
  }, [])

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand' : 'Collapse'}
          aria-label="Toggle sidebar"
        >
          <span className="sidebar__toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <img className="sidebar__logo-img" src="/companylogo.svg" alt="Company logo" />
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
          >
            <span className="sidebar__link-icon" aria-hidden="true">{renderIcon(item.icon)}</span>
            {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar__footer">
        {!collapsed ? (
          <div className="sidebar__user-row">
            <div
              className="sidebar__user"
              role="button"
              tabIndex={0}
              onClick={openProfile}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openProfile()
                }
              }}
            >
              <div className="sidebar__avatar">{user?.name?.charAt(0) || 'U'}</div>
              <div className="sidebar__user-info">
                <p className="sidebar__user-name">{user?.name}</p>
                <p className="sidebar__user-role">{user?.role}</p>
              </div>
            </div>
            <button
              className="sidebar__logout sidebar__logout--inline"
              onClick={() => setShowLogout(true)}
              title="Logout"
              aria-label="Logout"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5" />
                <path d="M15 16l4-4-4-4" />
                <path d="M9 12h10" />
              </svg>
            </button>
          </div>
        ) : (
          <button className="sidebar__logout sidebar__logout--icon" onClick={() => setShowLogout(true)} title="Logout" aria-label="Logout">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5" />
              <path d="M15 16l4-4-4-4" />
              <path d="M9 12h10" />
            </svg>
          </button>
        )}
      </div>

      {showLogout && (
        <div className="logout-modal" role="presentation">
          <div className="logout-modal__overlay" onClick={() => setShowLogout(false)} />
          <div
            className="logout-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title-sidebar"
            aria-describedby="logout-desc-sidebar"
            onClick={event => event.stopPropagation()}
          >
            <div className="logout-modal__head">
              <h3 id="logout-title-sidebar">Logout</h3>
            </div>
            <div className="logout-modal__body">
              <p id="logout-desc-sidebar">Are you sure you want to logout?</p>
            </div>
            <div className="logout-modal__footer">
              <button className="btn btn-danger btn-sm" onClick={handleLogout}>
                Yes
              </button>
              <button
                ref={cancelRef}
                className="btn btn-secondary btn-sm"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className={`profile-modal${profileClosing ? ' profile-modal--closing' : ''}`} role="presentation">
          <div className="profile-modal__overlay" onClick={closeProfile} />
          <div
            className="profile-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            onClick={event => event.stopPropagation()}
          >
            <div className="profile-modal__header">
              <div className="profile-modal__identity">
                <div className="profile-modal__avatar">{(profileForm.name || user?.name || 'U').charAt(0)}</div>
                <div>
                  <p id="profile-title" className="profile-modal__name">{profileForm.name || user?.name}</p>
                  <p className="profile-modal__role">{user?.role?.toUpperCase()} · {profileForm.department || user?.department || '—'}</p>
                </div>
              </div>
              <button className="profile-modal__close" onClick={closeProfile} aria-label="Close profile">
                ×
              </button>
            </div>
            <div className="profile-modal__body">
              <div className="profile-modal__section">
                <div className="profile-modal__section-head">
                  <h4>Personal & Contact</h4>
                  {editingProfile ? (
                    <div className="profile-modal__actions">
                      <button className="btn btn-primary btn-sm" onClick={handleProfileSave}>Save</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingProfile(false)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingProfile(true)}>Edit</button>
                  )}
                </div>
                <div className="profile-modal__section-body">
                  {editingProfile ? (
                    <div className="profile-modal__grid">
                      <FormField id="pname" label="Full Name" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} required />
                      <FormField id="pphone" label="Phone" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                      <FormField id="pdept" label="Department" value={profileForm.department} onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))} placeholder="Department" />
                      <FormField id="pemail" label="Email (read-only)" value={user?.email || ''} disabled />
                    </div>
                  ) : (
                    <div className="profile-modal__grid">
                      {[
                        ['Full Name', profileForm.name || user?.name],
                        ['Email', user?.email],
                        ['Phone', profileForm.phone || user?.phone || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="profile-modal__info">
                          <p className="profile-modal__info-key">{k}</p>
                          <p className="profile-modal__info-val">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="profile-modal__section">
                <div className="profile-modal__section-head">
                  <h4>Role Details</h4>
                </div>
                <div className="profile-modal__section-body">
                  <div className="profile-modal__grid">
                    {[
                      ['Department', profileForm.department || user?.department || '—'],
                      ['Role', user?.role?.toUpperCase()],
                      ['Employee ID', `EMP-00${user?.id || 1}`],
                    ].map(([k, v]) => (
                      <div key={k} className="profile-modal__info">
                        <p className="profile-modal__info-key">{k}</p>
                        <p className="profile-modal__info-val">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
