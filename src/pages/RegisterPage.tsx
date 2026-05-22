import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Spinner } from '../components/Spinner'
import { register } from '../features/auth/authApi'
import { ApiClientError } from '../lib/apiClient'
import { withMinDelay } from '../lib/minDelay'

export function RegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    const normalizedFullName = fullName.trim()
    const normalizedEmail = email.trim()

    if (!normalizedFullName || !normalizedEmail || !password) {
      setErrorMessage('Complete all required fields.')
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage('Enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)

    try {
      await withMinDelay(
        register({ fullName: normalizedFullName, email: normalizedEmail, password }),
      )
      navigate('/login', {
        replace: true,
        state: { registeredEmail: normalizedEmail },
      })
    } catch (error) {
      setErrorMessage(getRegisterErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-card">
      <div>
        <p className="eyebrow">Register</p>
        <h2>Create your SecureBank profile</h2>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label>
          Full name
          <input
            type="text"
            name="fullName"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="muted-text">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}

function getRegisterErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const fieldErrors = error.details.validationErrors

    if (fieldErrors) {
      return Object.values(fieldErrors).join(' ')
    }

    if (error.status === 409) {
      return 'An account with this email may already exist.'
    }
  }

  return 'Registration could not be completed.'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
