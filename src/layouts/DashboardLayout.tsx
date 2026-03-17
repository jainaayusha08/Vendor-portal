import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar'
import Header from '../components/Header/Header'
import './DashboardLayout.css'

interface NavItem { path: string; label: string; icon: string }

interface Props {
  navItems: NavItem[]
  pageTitle: string
  roleLabel: string
  roleColor: string
}

export default function DashboardLayout({ navItems, pageTitle, roleLabel, roleColor }: Props) {
  return (
    <div className="dash-layout">
      <Sidebar items={navItems} roleLabel={roleLabel} roleColor={roleColor} />
      <div className="dash-layout__main">
        <Header title={pageTitle} />
        <div className="dash-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
