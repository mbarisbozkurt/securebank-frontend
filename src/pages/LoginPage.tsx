import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Spinner } from '../components/Spinner'
import { login } from '../features/auth/authApi'
import { useAuth } from '../features/auth/useAuth'
import { withMinDelay } from '../lib/minDelay'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isRestoringSession, setSession } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = getRedirectPath(location.state)
  const registeredEmail = getRegisteredEmail(location.state)

  if (!isRestoringSession && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password) {
      setErrorMessage('Enter your email and password.')
      return
    }

    if (!isValidEmail(email)) {
      setErrorMessage('Enter a valid email address.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await withMinDelay(login({ email: email.trim(), password }))
      setSession({ accessToken: response.token })
      navigate(redirectTo, { replace: true })
    } catch {
      setErrorMessage('Email or password is incorrect.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-card">
      <div>
        <p className="eyebrow">Sign in</p>
        <h2>Access your account</h2>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {registeredEmail ? (
        <p className="form-success">Account created for {registeredEmail}. You can sign in now.</p>
      ) : null}

      <p className="muted-text">
        New to SecureBank? <Link to="/register">Create an account</Link>
      </p>
    </div>
  )
}

function getRedirectPath(state: unknown) {
  if (
    state &&
    typeof state === 'object' &&
    'from' in state &&
    state.from &&
    typeof state.from === 'object' &&
    'pathname' in state.from &&
    typeof state.from.pathname === 'string'
  ) {
    return state.from.pathname
  }

  return '/dashboard'
}

function getRegisteredEmail(state: unknown) {
  if (
    state &&
    typeof state === 'object' &&
    'registeredEmail' in state &&
    typeof state.registeredEmail === 'string'
  ) {
    return state.registeredEmail
  }

  return ''
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
