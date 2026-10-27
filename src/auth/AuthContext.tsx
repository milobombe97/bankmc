import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { signOutAdmin } from './admins'
import { loadAccount, saveAccount, type Account } from './session'
import { restoreSupabaseSession, signInWithSupabase, signUpWithSupabase } from '../data/remote'
import { supabase, supabaseEnabled } from '../lib/supabase'

type AuthResult = { error?: string; account?: Account }

type AuthContextValue = {
  session: Session | null
  loading: boolean
  configured: boolean
  signUp: (account: Account) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(supabaseEnabled())

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true
    void (async () => {
      await restoreSupabaseSession()
      const { data } = await supabase.auth.getSession()
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })()
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      configured: supabaseEnabled(),
      async signUp(account) {
        if (!supabase) {
          saveAccount(account)
          return { account }
        }
        return signUpWithSupabase(account)
      },
      async signIn(email, password) {
        if (supabase) return signInWithSupabase(email, password)
        const account = loadAccount()
        if (!account || account.email.toLowerCase() !== email.trim().toLowerCase() || account.password !== password) {
          return { error: 'Email or password does not match the account on this browser.' }
        }
        const next = { ...account, signedIn: true }
        saveAccount(next)
        return { account: next }
      },
      async signOut() {
        const account = loadAccount()
        if (account?.signedIn) saveAccount({ ...account, signedIn: false })
        signOutAdmin()
        if (supabase) await supabase.auth.signOut()
        setSession(null)
      },
    }),
    [loading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
