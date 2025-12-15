// src/components/Account.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../state/AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import Orders from './Orders.jsx'

export default function Account() {
    const { session, user, loading, signOut } = useAuth()
    const [profile, setProfile] = useState(null)
    const [saving, setSaving] = useState(false)
    const [note, setNote] = useState('')

    // ensure a profile row exists
    async function ensureProfile(u) {
        if (!u?.id) return
        const { data, error } = await supabase
            .from('profiles').select('id').eq('id', u.id).limit(1)
        if (error) { console.warn('profile check failed', error.message); return }
        const exists = Array.isArray(data) && data.length > 0
        if (!exists) {
            const meta = u.user_metadata || {}
            const { error: insErr } = await supabase.from('profiles').insert({
                id: u.id,
                full_name: meta.full_name || '',
                phone: meta.phone || ''
            })
            if (insErr) console.warn('profile create failed:', insErr.message)
        }
    }

    async function loadProfile(u) {
        if (!u?.id) { setProfile(null); return }
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', u.id)
            .single()
        if (error) { console.warn(error.message) }
        setProfile(data || { id: u.id })
    }

    useEffect(() => {
        let mounted = true
        const run = async () => {
            if (!user) { if (mounted) setProfile(null); return }
            await ensureProfile(user)
            await loadProfile(user)
        }
        run()
        return () => { mounted = false }
    }, [user?.id])

    if (loading) {
        return (
            <section id="account" className="wrap">
                <h2 className="section-title">Account</h2>
                <p className="section-sub">Loading…</p>
            </section>
        )
    }

    if (!user) {
        return (
            <section id="account" className="wrap">
                <h2 className="section-title">Account</h2>
                <p className="section-sub">Create an account or sign in to manage your details and view orders.</p>
                <AuthModal />
            </section>
        )
    }

    async function saveProfile(e) {
        e.preventDefault()
        setSaving(true); setNote('Saving…')
        const up = {
            id: user.id,
            full_name: profile?.full_name || '',
            phone: profile?.phone || '',
            address: profile?.address || '',
            city: profile?.city || '',
            state: profile?.state || '',
            zip: profile?.zip || ''
        }
        const { error } = await supabase.from('profiles').upsert(up)
        setSaving(false)
        if (error) return setNote(error.message)
        setNote('Saved.')
    }

    return (
        <section id="account" className="wrap">
            <h2 className="section-title">My Account</h2>
            <p className="section-sub">Signed in as {user.email}</p>

            <div className="card" style={{ marginBottom: 24 }}>
                <form onSubmit={saveProfile}>
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label>Full name</label>
                            <input value={profile?.full_name || ''} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
                        </div>
                        <div>
                            <label>Phone</label>
                            <input value={profile?.phone || ''} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div>
                            <label>Address</label>
                            <input value={profile?.address || ''} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} />
                        </div>
                        <div>
                            <label>City</label>
                            <input value={profile?.city || ''} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} />
                        </div>
                        <div>
                            <label>State</label>
                            <input value={profile?.state || ''} onChange={e => setProfile(p => ({ ...p, state: e.target.value }))} />
                        </div>
                        <div>
                            <label>ZIP</label>
                            <input value={profile?.zip || ''} onChange={e => setProfile(p => ({ ...p, zip: e.target.value }))} />
                        </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                        <button className="cta" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
                        <button className="mini-btn" type="button" onClick={signOut}>Sign out</button>
                    </div>
                    <p className="small" style={{ marginTop: 8 }}>{note}</p>
                </form>
            </div>
             
            <div className="card">
                <h3 style={{ marginTop: 0 }}>My Orders</h3>
                <Orders compact />
            </div>

            {/* Change Password */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ marginTop: 0 }}>Change Password</h3>
                <ChangePasswordBlock userEmail={user.email} onAfterChange={() => signOut()} />
            </div>

        </section>

    )
}

function ChangePasswordBlock({ userEmail, onAfterChange }) {
    const [newPass, setNewPass] = useState('')
    const [confirm, setConfirm] = useState('')
    const [working, setWorking] = useState(false)
    const [msg, setMsg] = useState('')

    const minLen = 6 // Supabase default policy unless you customized it

    const doChange = async (e) => {
        e.preventDefault()
        setMsg('');

        if (!newPass || !confirm) return setMsg('Enter and confirm your new password.')
        if (newPass !== confirm) return setMsg('Passwords do not match.')
        if (newPass.length < minLen) return setMsg(`Password must be at least ${minLen} characters.`)

        setWorking(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPass })
            if (error) {
                setMsg(error.message || 'Could not change password.')
                return
            }
            setMsg('✅ Password updated. You’ll be signed out to re-authenticate.')
            // Give a moment for the message, then sign the user out
            setTimeout(() => {
                try { onAfterChange?.() } catch { }
            }, 800)
        } catch (err) {
            setMsg(err?.message || 'Unexpected error changing password.')
        } finally {
            setWorking(false)
        }
    }

    const sendResetEmail = async () => {
        setMsg('')
        if (!userEmail) return setMsg('No email on file for this account.')

        setWorking(true)
        try {
            const redirectTo =
                (typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined)

            const { error } = await supabase.auth.resetPasswordForEmail(userEmail, { redirectTo })
            if (error) {
                setMsg(error.message || 'Could not send reset email.')
                return
            }
            setMsg('📨 Reset email sent. Check your inbox.')
        } catch (err) {
            setMsg(err?.message || 'Unexpected error sending reset email.')
        } finally {
            setWorking(false)
        }
    }

    return (
        <form onSubmit={doChange}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                    <label>New password</label>
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                    />
                </div>
                <div>
                    <label>Confirm new password</label>
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="cta" type="submit" disabled={working}>
                    {working ? 'Updating…' : 'Update password'}
                </button>
                <button className="mini-btn" type="button" onClick={sendResetEmail} disabled={working}>
                    Send reset email
                </button>
            </div>

            {msg && <p className="small" style={{ marginTop: 8 }}>{msg}</p>}
        </form>
    )
}

