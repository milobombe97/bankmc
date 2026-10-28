import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { signInAdmin } from '../../auth/admins'
import { useAuth } from '../../auth/AuthContext'
import { useAdmin } from '../../auth/useAdmin'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { IconText, PasswordInput } from '../../components/PasswordInput'

export function AdminLoginPage() {
  const admin = useAdmin()
  const { configured, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (admin) return <Navigate to="/admin" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (configured) {
      const remote = await signIn(email, password)
      if (!remote.error && (remote.account?.role === 'admin' || remote.account?.role === 'super')) {
        navigate('/admin')
        return
      }
      await signOut()
      setError(
        remote.account
          ? 'This email is a client account. Staff must sign in here with info@nevoluteinc.com (or another staff profile).'
          : remote.error ?? 'Email or password was not accepted.',
      )
      return
    }
    const signedIn = signInAdmin(email, password)
    if (!signedIn) {
      setError('Email or password does not match an admin on this browser.')
      return
    }
    navigate('/admin')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link to="/" className="text-lg font-semibold tracking-[-0.03em]">
        Nevolute
      </Link>
      <h1 className="mt-8 text-3xl font-medium tracking-[-0.04em]">Admin login</h1>
      <p className="mt-2 text-sm text-revolut-ink/60">
        Staff access for Nevolute Inc. The first super admin on this browser is admin@nevolute.inc, password admin-pass-1.
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <Field label="Email">
          <IconText
            icon="mail"
            type="email"
            autoComplete="username"
            required
            placeholder="admin@nevolute.inc"
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
        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-sm text-revolut-ink/55">
        <Link to="/signin" className="font-medium text-revolut-ink hover:underline">
          Client login
        </Link>
      </p>
    </main>
  )
}
