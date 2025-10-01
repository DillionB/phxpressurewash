import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthModal() {
  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => setNote(''), [mode])

  const redirect = () => `${window.location.origin}/#account`

  async function doSignIn(e) {
    e.preventDefault()
    setBusy(true); setNote('Signing in...')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) return setNote(error.message)
    setNote('Signed in.')
  }

  async function doSignUp(e) {
    e.preventDefault()
    setBusy(true); setNote('Creating account...')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: redirect(),
        data: { full_name: fullName, phone }
      }
    })
    setBusy(false)
    if (error) return setNote(error.message)
    setNote('Check your email to confirm your address.')
  }

  async function doReset(e) {
    e.preventDefault()
    setBusy(true); setNote('Sending reset email...')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirect()
    })
    setBusy(false)
    if (error) return setNote(error.message)
    setNote('If the email exists, a reset link has been sent.')
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button className={`tab ${mode==='signin'?'active':''}`} onClick={()=>setMode('signin')}>Sign in</button>
        <button className={`tab ${mode==='signup'?'active':''}`} onClick={()=>setMode('signup')}>Create account</button>
        <button className={`tab ${mode==='forgot'?'active':''}`} onClick={()=>setMode('forgot')}>Reset</button>
      </div>

      {mode === 'signin' && (
        <form onSubmit={doSignIn}>
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <div style={{ marginTop: 10 }}>
            <button className="cta" disabled={busy} type="submit">{busy ? 'Signing in...' : 'Sign in'}</button>
          </div>
        </form>
      )}

      {mode === 'signup' && (
        <form onSubmit={doSignUp}>
          <label>Full name</label>
          <input value={fullName} onChange={e=>setFullName(e.target.value)} required />
          <label>Phone</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} />
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <div style={{ marginTop: 10 }}>
            <button className="cta" disabled={busy} type="submit">{busy ? 'Creating...' : 'Create account'}</button>
          </div>
        </form>
      )}

      {mode === 'forgot' && (
        <form onSubmit={doReset}>
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <div style={{ marginTop: 10 }}>
            <button className="cta" disabled={busy} type="submit">{busy ? 'Sending...' : 'Send reset link'}</button>
          </div>
        </form>
      )}

      <p className="small" style={{ marginTop: 10 }}>{note}</p>
    </div>
  )
}
