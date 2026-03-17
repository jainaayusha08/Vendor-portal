import { useAuth } from '../../context/AuthContext'
import './Header.css'

interface Props { title: string }

const ROLE_COLORS: Record<string, string> = {
  vendor: '#0e9f6e', employee: '#1a56db', admin: '#7c3aed', sap: '#d97706',
}

export default function Header({ title }: Props) {
  const { user } = useAuth()
  return (
    <header className="app-header">
      <div className="app-header__left">
        <h1 className="app-header__title">{title}</h1>
      </div>
      <div className="app-header__right">
        <span className="app-header__date">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <div className="app-header__role-badge" style={{ background: ROLE_COLORS[user?.role || 'admin'] + '18', color: ROLE_COLORS[user?.role || 'admin'], border: `1px solid ${ROLE_COLORS[user?.role || 'admin']}40` }}>
          {user?.role?.toUpperCase()}
        </div>
        <div className="app-header__avatar" style={{ background: ROLE_COLORS[user?.role || 'admin'] }}>
          {user?.name?.charAt(0)}
        </div>
      </div>
    </header>
  )
}
