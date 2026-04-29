import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('password')
  const [sent, setSent] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const mapAuthError = (message) => {
    if (message === 'Invalid login credentials') return 'Email o contraseña incorrectos.'
    return message || 'No se pudo completar el inicio de sesión'
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResetMsg('')
    const em = email.trim()
    if (!em || !password || password.length < 8) return
    setBusy(true)
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email: em, password })
      if (signErr) throw signErr
      navigate('/app', { replace: true })
    } catch (err) {
      setError(mapAuthError(err.message))
    } finally {
      setBusy(false)
    }
  }

  const handleMagicSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const redirect = `${window.location.origin}/app`
      const { error: signErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirect },
      })
      if (signErr) throw signErr
      setSent(true)
    } catch (err) {
      setError(err.message || 'No se pudo enviar el enlace')
    } finally {
      setBusy(false)
    }
  }

  const handleResetPassword = async () => {
    setError('')
    setResetMsg('')
    const em = email.trim()
    if (!em) {
      setError('Escribe tu correo arriba para restablecer.')
      return
    }
    setBusy(true)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(em, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (resetErr) throw resetErr
      setResetMsg('Te enviamos un correo para restablecer.')
    } catch (err) {
      setError(err.message || 'No se pudo enviar el correo')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(180deg, #0A1A0F 0%, #0D2010 100%)' }}
      >
        <p className="max-w-md text-center font-accent text-[#F5F0E8]">
          Revisa tu correo: te enviamos un enlace mágico para entrar a Yacunaj OPS.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 text-sm text-[#C9A227] underline"
        >
          Volver al menú público
        </button>
      </div>
    )
  }

  const disabledSubmit =
    busy ||
    !email.trim() ||
    (mode === 'password' && (!password || password.length < 8))

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(180deg, #0A1A0F 0%, #0D2010 100%)' }}
    >
      <div className="w-full max-w-sm rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(13,32,16,0.85)] p-8">
        <h1 className="mb-1 text-center font-heading text-2xl text-[#C9A227]">
          Yacunaj OPS
        </h1>
        <p className="mb-6 text-center font-accent text-xs text-[rgba(245,240,232,0.65)]">
          {mode === 'password' ? 'Acceso staff' : 'Enlace de un solo uso'}
        </p>

        {mode === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="staff-email" className="mb-1 block font-accent text-xs text-[rgba(245,240,232,0.75)]">
                Correo electrónico
              </label>
              <input
                id="staff-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-[rgba(201,162,39,0.3)] bg-[rgba(10,26,15,0.6)] px-3 py-2 font-accent text-sm text-[#F5F0E8] outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label htmlFor="staff-password" className="mb-1 block font-accent text-xs text-[rgba(245,240,232,0.75)]">
                Contraseña
              </label>
              <input
                id="staff-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-[rgba(201,162,39,0.3)] bg-[rgba(10,26,15,0.6)] px-3 py-2 font-accent text-sm text-[#F5F0E8] outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            {error && (
              <p className="font-accent text-xs text-red-300" role="alert">
                {error}
              </p>
            )}
            {resetMsg && (
              <p className="font-accent text-xs text-emerald-200" role="status">
                {resetMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={disabledSubmit}
              className="rounded bg-gradient-to-br from-[#C9A227] to-[#D4AF37] py-2.5 font-accent text-sm font-semibold uppercase tracking-wide text-[#0A1A0F] disabled:opacity-50"
            >
              {busy ? 'Ingresando…' : 'Ingresar'}
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={busy}
              className="font-accent text-xs text-[#C9A227] underline disabled:opacity-50"
            >
              Restablecer contraseña
            </button>
            <button
              type="button"
              onClick={() => { setMode('magic'); setError(''); setResetMsg('') }}
              className="font-accent text-xs text-[rgba(245,240,232,0.55)] underline"
            >
              ¿Prefieres enlace mágico? (legacy)
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="magic-email" className="mb-1 block font-accent text-xs text-[rgba(245,240,232,0.75)]">
                Correo electrónico
              </label>
              <input
                id="magic-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-[rgba(201,162,39,0.3)] bg-[rgba(10,26,15,0.6)] px-3 py-2 font-accent text-sm text-[#F5F0E8] outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
                placeholder="tu@correo.com"
              />
            </div>
            {error && (
              <p className="font-accent text-xs text-red-300" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="rounded bg-gradient-to-br from-[#C9A227] to-[#D4AF37] py-2.5 font-accent text-sm font-semibold uppercase tracking-wide text-[#0A1A0F] disabled:opacity-50"
            >
              {busy ? 'Enviando…' : 'Enviar enlace'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('password'); setError('') }}
              className="font-accent text-xs text-[rgba(245,240,232,0.55)] underline"
            >
              Volver a contraseña
            </button>
          </form>
        )}

        <p className="mt-4 rounded border border-[rgba(201,162,39,0.15)] bg-[rgba(10,26,15,0.35)] p-3 font-accent text-[0.65rem] leading-relaxed text-[rgba(245,240,232,0.55)]">
          Las cuentas se crean desde Supabase → Authentication → Users (admin); no hay registro público aquí.
        </p>

        <p className="mt-6 text-center font-accent text-xs">
          <Link to="/" className="text-[#C9A227] underline">
            Menú para clientes
          </Link>
        </p>
      </div>
    </div>
  )
}
