import { Navigate, Route, Routes } from 'react-router-dom'

import { AdminRoute, ProtectedRoute } from '../features/auth/routes'
import { AppLayout } from '../layouts/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { AccountsPage } from '../pages/AccountsPage'
import { AdminDashboardPage } from '../pages/AdminDashboardPage'
import { AuditLogsPage } from '../pages/AuditLogsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RecipientsPage } from '../pages/RecipientsPage'
import { RegisterPage } from '../pages/RegisterPage'
import { TransactionsPage } from '../pages/TransactionsPage'
import { TransferPage } from '../pages/TransferPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/recipients" element={<RecipientsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
