import { Landmark, LineChart, WalletCards } from 'lucide-react'
import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-label="SecureBank authentication">
        <div className="auth-identity">
          <div className="brand-lockup">
            <span className="brand-mark">
              <Landmark size={22} aria-hidden />
            </span>
            <div>
              <p className="eyebrow">SecureBank</p>
              <h1>Banking workspace</h1>
            </div>
          </div>

          <div className="auth-copy">
            <p className="eyebrow">SecureBank online</p>
            <h2>Your banking workspace</h2>
            <p>Manage accounts, transfers, and transaction history in one place.</p>
          </div>

          <div className="auth-signal-grid" aria-label="Security status">
            <div className="auth-signal">
              <LineChart size={17} aria-hidden />
              <span>Modern banking</span>
            </div>
            <div className="auth-signal">
              <WalletCards size={17} aria-hidden />
              <span>Built for control</span>
            </div>
          </div>
        </div>

        <Outlet />
      </section>
    </main>
  )
}
