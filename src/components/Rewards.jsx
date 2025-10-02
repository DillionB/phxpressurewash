import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const TIER1_POINTS = 3

export default function Rewards() {
  const [user, setUser] = useState(null)
  const [points, setPoints] = useState(0)
  const [tier1, setTier1] = useState(null) // { code, issued_at, redeemed_at } or null
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u || null)
      if (!u) { setPoints(0); setTier1(null); setLoading(false); return }

      const email = u.email
      let filter = ''
      if (u.id && email) filter = `user_id.eq.${u.id},email.eq.${email}`
      else if (u.id) filter = `user_id.eq.${u.id}`
      else if (email) filter = `email.eq.${email}`

      // count points
      const cnt = await supabase
        .from('rewards_ledger')
        .select('*', { count: 'exact', head: true })
        .or(filter)
      const total = cnt.count || 0
      setPoints(total)

      // get awards (tier 1)
      const aw = await supabase
        .from('rewards_awards')
        .select('code, issued_at, redeemed_at, tier')
        .eq('tier', 1)
        .or(filter)
        .maybeSingle()
      if (!aw.error && aw.data) setTier1(aw.data)
      else setTier1(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const reload = () => load()
    window.addEventListener('orders:refresh', reload)  // after checkout return
    return () => window.removeEventListener('orders:refresh', reload)
  }, [load])

  const pct = Math.min(100, Math.floor((points / TIER1_POINTS) * 100))

  return (
    <section id="rewards" className="wrap">
      <h2 className="section-title">Rewards</h2>
      {!user && <p className="section-sub">Sign in to see your rewards.</p>}
      {user && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div><b>Current points:</b> {points}</div>
                <div className="small">Tier 1 at {TIER1_POINTS} points (10% off coupon)</div>
              </div>
              <div style={{ minWidth: 220 }}>
                <div className="small">Progress</div>
                <div style={{ height: 8, background: '#1a2a2a', borderRadius: 6, border: '1px solid #184848', overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', height: '100%', background: '#2C8C8C' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Tier 1: 10% Off</h3>
              {!tier1 && points < TIER1_POINTS && (
                <p>Earn {TIER1_POINTS - points} more point(s) to unlock a 10% off coupon.</p>
              )}
              {!tier1 && points >= TIER1_POINTS && (
                <p>Coupon will be issued shortly after your next page refresh or order sync.</p>
              )}
              {tier1 && (
                <>
                  <p>Your 10% off code:</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <code style={{ padding: '6px 10px', border: '1px solid #184848', borderRadius: 6 }}>
                      {tier1.code}
                    </code>
                    <button
                      className="mini-btn"
                      onClick={() => navigator.clipboard.writeText(tier1.code)}
                    >Copy</button>
                  </div>
                  <p className="small" style={{ marginTop: 8 }}>
                    Apply this code at checkout. One-time use.
                  </p>
                </>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Tier 2: Coming Soon</h3>
              <p>Future rewards will appear here so customers can see what is next.</p>
            </div>
          </div>
        </>
      )}
      {loading && <p className="small">Loading...</p>}
    </section>
  )
}
