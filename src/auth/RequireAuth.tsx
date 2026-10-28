import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdmin } from './useAdmin'
import { useAccount } from './useAccount'
import { useAuth } from './AuthContext'
import { accountStatusOf } from '../data/adminAccounts'

export function RequireAuth({ area, children }: { area: 'customer' | 'admin'; children: ReactNode }) {
  const { session, loading, configured } = useAuth()
  const account = useAccount()
  const admin = useAdmin()

  if (loading) {
    return <p className="p-8 text-sm text-revolut-ink/60">Checking your session…</p>
  }

  const signedIn = area === 'admin' ? Boolean(admin) : Boolean(account)
  if (configured && !session) {
    return <Navigate to={area === 'admin' ? '/admin/login' : '/signin'} replace />
  }
  if (!signedIn) {
    return <Navigate to={area === 'admin' ? '/admin/login' : '/signin'} replace />
  }

  if (area === 'customer' && account) {
    const status = accountStatusOf(account)
    if (status === 'deleted') {
      return <Navigate to="/signin" replace />
    }
  }

  return children
}
