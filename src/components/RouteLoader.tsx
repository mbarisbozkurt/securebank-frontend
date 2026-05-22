import { Landmark } from 'lucide-react'

export function RouteLoader() {
  return (
    <main className="route-loader" aria-live="polite" aria-busy="true">
      <div className="loader-card">
        <span className="loader-brand">
          <Landmark size={22} aria-hidden />
        </span>
        <div>
          <p className="eyebrow">SecureBank</p>
          <strong>Restoring secure session</strong>
        </div>
        <span className="loader-bar" aria-hidden />
      </div>
    </main>
  )
}
