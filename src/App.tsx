import { BrowserRouter } from 'react-router-dom'

import { AppRoutes } from './app/routes'
import { ToastProvider } from './components/ToastProvider'
import { AuthProvider } from './features/auth/AuthContext'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
