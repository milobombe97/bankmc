import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { loadAccount, saveAccount } from './auth/session'
import { restoreSupabaseSession } from './data/remote'
import { BusinessPage } from './pages/BusinessPage'
import { CompanyPage } from './pages/CompanyPage'
import { KycPage } from './pages/auth/KycPage'
import { SignInPage } from './pages/auth/SignInPage'
import { SignUpPage } from './pages/auth/SignUpPage'
import { DashboardCards } from './pages/dashboard/DashboardCards'
import { DashboardHome } from './pages/dashboard/DashboardHome'
import { DashboardNotificationDetail } from './pages/dashboard/DashboardNotificationDetail'
import { DashboardNotifications } from './pages/dashboard/DashboardNotifications'
import { DashboardTransactionDetail } from './pages/dashboard/DashboardTransactionDetail'
import { DashboardLayout } from './pages/dashboard/DashboardLayout'
import { DashboardPayments } from './pages/dashboard/DashboardPayments'
import { DashboardProfile } from './pages/dashboard/DashboardProfile'
import { DashboardSettings } from './pages/dashboard/DashboardSettings'
import { DashboardTopUp } from './pages/dashboard/DashboardTopUp'
import { DashboardWithdraw } from './pages/dashboard/DashboardWithdraw'
import { AdminClientPage } from './pages/admin/AdminClientPage'
import { AdminKycDetail } from './pages/admin/AdminKycDetail'
import { AdminKycPage } from './pages/admin/AdminKycPage'
import { AdminNotificationDetail } from './pages/admin/AdminNotificationDetail'
import { AdminNotifications } from './pages/admin/AdminNotifications'
import { AdminPaymentDetail } from './pages/admin/AdminPaymentDetail'
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage'
import { AdminHome } from './pages/admin/AdminHome'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { AdminStaffPage } from './pages/admin/AdminStaffPage'
import { AdminTeamPage } from './pages/admin/AdminTeamPage'
import { HomePage } from './pages/HomePage'
import { AirPage } from './pages/sub/AirPage'
import { CardsPage } from './pages/sub/CardsPage'
import { InvestPage } from './pages/sub/InvestPage'
import { KidsTeensPage } from './pages/sub/KidsTeensPage'
import { PlansPage } from './pages/sub/PlansPage'
import { SavingsPage } from './pages/sub/SavingsPage'
import { SecurityPage } from './pages/sub/SecurityPage'

const storedAccount = loadAccount()
if (storedAccount?.signedIn && storedAccount.email.toLowerCase() === 'alex.morgan@example.com') {
  saveAccount({ ...storedAccount, signedIn: false })
}

export default function App() {
  useEffect(() => {
    void (async () => {
      await restoreSupabaseSession()
      const account = loadAccount()
      if (account?.signedIn && account.email.toLowerCase() === 'alex.morgan@example.com') {
        saveAccount({ ...account, signedIn: false })
      }
    })()
  }, [])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/business" element={<BusinessPage />} />
      <Route path="/company" element={<CompanyPage />} />
      <Route path="/kids-teens" element={<KidsTeensPage />} />
      <Route path="/savings" element={<SavingsPage />} />
      <Route path="/cards" element={<CardsPage />} />
      <Route path="/air" element={<AirPage />} />
      <Route path="/invest" element={<InvestPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="clients/:id" element={<AdminClientPage />} />
        <Route path="kyc" element={<AdminKycPage />} />
        <Route path="kyc/:id" element={<AdminKycDetail />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="payments/:clientId/:paymentId" element={<AdminPaymentDetail />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="notifications/:id" element={<AdminNotificationDetail />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="team" element={<AdminTeamPage />} />
        <Route path="team/:id" element={<AdminStaffPage />} />
      </Route>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/kyc" element={<KycPage />} />
      <Route path="/account" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="topup" element={<DashboardTopUp />} />
        <Route path="withdraw" element={<DashboardWithdraw />} />
        <Route path="payments" element={<DashboardPayments />} />
        <Route path="notifications" element={<DashboardNotifications />} />
        <Route path="notifications/:id" element={<DashboardNotificationDetail />} />
        <Route path="activity/:id" element={<DashboardTransactionDetail />} />
        <Route path="cards" element={<DashboardCards />} />
        <Route path="profile" element={<DashboardProfile />} />
        <Route path="settings" element={<DashboardSettings />} />
      </Route>
    </Routes>
  )
}
