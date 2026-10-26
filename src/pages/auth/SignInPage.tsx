import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadAccount, saveAccount } from '../../auth/session'
import { signInWithSupabase } from '../../data/remote'
import { supabaseEnabled } from '../../lib/supabase'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { IconText, PasswordInput } from '../../components/PasswordInput'
import { AuthLayout } from './AuthLayout'

export function SignInPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (supabaseEnabled()) {
      const remote = await signInWithSupabase(email, password)
      if (!remote.error && remote.account) {
        if (remote.account.kycStatus === 'not_started' || remote.account.kycStatus === 'rejected') {
          navigate('/kyc')
          return
        }
        navigate(remote.account.role === 'admin' || remote.account.role === 'super' ? '/admin' : '/dashboard')
        return
      }
    }
    const account = loadAccount()
    if (!account || account.email.toLowerCase() !== email.trim().toLowerCase() || account.password !== password) {
      setError(supabaseEnabled() ? 'Email or password was not accepted.' : 'Email or password does not match the account on this browser.')
      return
    }
    saveAccount({ ...account, signedIn: true })
    if (account.kycStatus === 'not_started' || account.kycStatus === 'rejected') {
      navigate('/kyc')
      return
    }
    navigate('/dashboard')
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Use the email and password from the account you created in this browser."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email">
          <IconText
            icon="mail"
            type="email"
            autoComplete="email"
            required
            placeholder="name@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
            }}
          />
        </Field>
        <Field label="Password" error={error || undefined}>
          <PasswordInput
            autoComplete="current-password"
            required
            placeholder="Your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError('')
            }}
          />
        </Field>
        <Button type="submit" className="mt-2 w-full">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-sm text-revolut-ink/65">
        New here?{' '}
        <Link to="/signup" className="font-medium text-revolut-ink underline-offset-4 hover:underline">
          Create an account
        </Link>
        <span className="mx-2 text-revolut-ink/30">·</span>
        <Link to="/admin" className="font-medium text-revolut-ink underline-offset-4 hover:underline">
          Admin access
        </Link>
      </p>
    </AuthLayout>
  )
}
