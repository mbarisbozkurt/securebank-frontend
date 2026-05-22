import {
  ArrowRightLeft,
  BarChart3,
  ClipboardList,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  ShieldCheck,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../features/auth/useAuth'

const primaryNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'Accounts', icon: CreditCard },
  { to: '/transfer', label: 'Transfer', icon: ArrowRightLeft },
  { to: '/recipients', label: 'Recipients', icon: UserRoundCheck },
  { to: '/transactions', label: 'Transactions', icon: ReceiptText },
]

const adminNavItems = [
  { to: '/admin', label: 'Admin', icon: BarChart3 },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
]

export function AppLayout() {
  const { logout, user } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">
            <Landmark size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">SecureBank</p>
            <strong>Control Center</strong>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {primaryNavItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {user?.role === 'ADMIN' ? (
          <nav className="sidebar-nav admin-nav" aria-label="Admin navigation">
            <p className="nav-section">Admin</p>
            {adminNavItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
        ) : null}
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="session-chip">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>{user?.email}</span>
            <strong>Active</strong>
          </div>
          <button className="icon-text-button" type="button" onClick={logout}>
            <LogOut size={18} aria-hidden="true" />
            Logout
          </button>
        </header>

        <section className="content-surface">
          <Outlet />
        </section>
      </div>
    </div>
  )
}

type NavItemProps = {
  to: string
  label: string
  icon: LucideIcon
}

function NavItem({ to, label, icon: Icon }: NavItemProps) {
  return (
    <NavLink className="nav-link" to={to}>
      <Icon size={18} aria-hidden />
      <span>{label}</span>
    </NavLink>
  )
}
