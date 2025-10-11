import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function EmployeeLogin() {
    const nav = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)

    const signIn = async (e) => {
        e.preventDefault()
        setNote(''); setBusy(true)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) { setNote(error.message); return }
            // check admin
            const { data: prof } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', data.user.id)
                .maybeSingle()
            if (prof?.is_admin) nav('/employee/admin', { replace: true })
            else setNote('Not authorized for admin.')
        } finally { setBusy(false) }
    }

    return (
        <div className="center-wrap">
            <form className="card login-card" onSubmit={signIn}>
                <h3 style={{ marginTop: 0 }}>Admin Sign In</h3>
                <label className="tiny">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <label className="tiny" style={{ marginTop: 6 }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button className="cta" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
                {note && <div className="tiny" style={{ color: 'var(--sun)', marginTop: 6 }}>{note}</div>}
            </form>
        </div>
    )
}
