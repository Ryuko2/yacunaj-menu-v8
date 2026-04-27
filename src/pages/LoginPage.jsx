import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
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
          Acceso personal (magic link)
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          {error && (
            <p className="font-accent text-xs text-red-300" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-gradient-to-br from-[#C9A227] to-[#D4AF37] py-2.5 font-accent text-sm font-semibold uppercase tracking-wide text-[#0A1A0F] disabled:opacity-50"
          >
            {busy ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
        <p className="mt-6 text-center font-accent text-xs">
          <Link to="/" className="text-[#C9A227] underline">
            Menú para clientes
          </Link>
        </p>
      </div>
    </div>
  )
}
