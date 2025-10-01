import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Orders from './Orders.jsx' // you already have this

export default function Account() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    let sub = null
    supabase.auth.getSession().then(({ data }) => setSession(data?.session || null))
    sub = supabase.auth.onAuthStateChange((_evt, ses) => setSession(ses || null))
    return () => sub?.data?.subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    async function load() {
      if (!session?.user) { setProfile(null); return }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (error) console.error(error)
      setProfile(data || { id: session.user.id })
    }
    load()
  }, [session?.user?.id])

  if (!session?.user) {
    const AuthModal = require('./AuthModal.jsx').default
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
    setSaving(true); setNote('Saving...')
    const up = {
      id: session.user.id,
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      city: profile.city || '',
      state: profile.state || '',
      zip: profile.zip || ''
    }
    const { error } = await supabase.from('profiles').upsert(up)
    setSaving(false)
    if (error) return setNote(error.message)
    setNote('Saved.')
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <section id="account" className="wrap">
      <h2 className="section-title">My Account</h2>
      <p className="section-sub">Signed in as {session.user.email}</p>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={saveProfile}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Full name</label>
              <input value={profile?.full_name || ''} onChange={e=>setProfile(p=>({...p, full_name:e.target.value}))}/>
            </div>
            <div>
              <label>Phone</label>
              <input value={profile?.phone || ''} onChange={e=>setProfile(p=>({...p, phone:e.target.value}))}/>
            </div>
            <div>
              <label>Address</label>
              <input value={profile?.address || ''} onChange={e=>setProfile(p=>({...p, address:e.target.value}))}/>
            </div>
            <div>
              <label>City</label>
              <input value={profile?.city || ''} onChange={e=>setProfile(p=>({...p, city:e.target.value}))}/>
            </div>
            <div>
              <label>State</label>
              <input value={profile?.state || ''} onChange={e=>setProfile(p=>({...p, state:e.target.value}))}/>
            </div>
            <div>
              <label>ZIP</label>
              <input value={profile?.zip || ''} onChange={e=>setProfile(p=>({...p, zip:e.target.value}))}/>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button className="cta" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
            <button className="mini-btn" type="button" onClick={signOut}>Sign out</button>
          </div>
          <p className="small" style={{ marginTop: 8 }}>{note}</p>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>My Orders</h3>
        <Orders compact />
      </div>
    </section>
  )
}
