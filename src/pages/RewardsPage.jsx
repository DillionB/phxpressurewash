// src/pages/RewardsPage.jsx
import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const TIER1_TARGET = 3

function PunchBox({ filled }) {
  return (
    <svg viewBox="0 0 120 120" className={`punch-svg ${filled ? 'is-filled' : ''}`} aria-hidden="true">
      <rect x="6" y="6" width="108" height="108" rx="12" className="punch-frame"/>
      <line x1="18" y1="22" x2="102" y2="22" className="punch-top"/>
      {Array.from({length:9}).map((_,i) => {
        const y = 30 + i*9.5
        return (
          <g key={i}>
            <line x1="18" y1={y} x2="28" y2={y} className="punch-tick"/>
            <line x1="92" y1={y} x2="102" y2={y} className="punch-tick"/>
          </g>
        )
      })}
      <polyline
        className="punch-zig"
        points="18,94 26,88 34,94 42,88 50,94 58,88 66,94 74,88 82,94 90,88 102,96"
        fill="none"
      />
      {filled && (
        <g className="punch-stamp">
          <circle cx="60" cy="64" r="26" className="punch-stamp-circle"/>
          <path d="M47 63 l9 9 17-17" className="punch-stamp-check" fill="none"/>
        </g>
      )}
    </svg>
  )
}

export default function RewardsPage(){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState(0)
  const [awards, setAwards] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(u || null)

      if (u) {
        const [ledgerRes, awardsRes] = await Promise.all([
          supabase.from('rewards_ledger').select('points').order('created_at', { ascending: true }),
          supabase.from('rewards_awards').select('*').order('issued_at', { ascending: false })
        ])
        if (mounted) {
          const total = (ledgerRes.data || []).reduce((sum, row) => sum + (row.points ?? 1), 0)
          setPoints(total)
          setAwards(awardsRes.data || [])
        }
      }
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const tier1ActiveAward = useMemo(
    () => awards.find(a => a.tier === 1 && !a.redeemed_at),
    [awards]
  )

  const tier1Progress = useMemo(() => {
    if (tier1ActiveAward) return TIER1_TARGET
    return points % TIER1_TARGET
  }, [points, tier1ActiveAward])

  return (
    <section className="wrap rewards-page">
      <h2 className="section-title">Rewards</h2>
      <p className="section-sub">
        Earn 1 punch for each completed order (online or in person). Reach a tier to unlock a discount.
      </p>

      {!user && (
        <div className="card callout">
          <b>Sign in to track your punches.</b>
          <div className="muted">Create an account to start earning rewards right away.</div>
          <a className="cta" href="/account" style={{marginTop:12}}>Sign in / Create account</a>
        </div>
      )}

      <div className="rewards-row">
        <article className="rewards-card">
          <header className="rewards-head">
            <div className="tier">
              <span className="tier-label">TIER 1</span>
              <h3><span className="sun">Rewards</span> Card</h3>
            </div>
            <div className="rule">3 punches = <b>10% off</b> next service</div>
          </header>

          <div className="punch-row">
            {[0,1,2].map(i => <PunchBox key={i} filled={tier1Progress > i} />)}
          </div>

          {user && (
            <footer className="rewards-foot">
              {loading && <div className="muted">Loading your punches...</div>}
              {!loading && !tier1ActiveAward && (
                <div className="muted">
                  {TIER1_TARGET - tier1Progress === 0
                    ? 'Reward will appear after processing.'
                    : `${TIER1_TARGET - tier1Progress} punch${TIER1_TARGET - tier1Progress === 1 ? '' : 'es'} to go.`}
                </div>
              )}
              {!loading && tier1ActiveAward && (
                <div className="award-line">
                  <span className="badge-on">Unlocked</span>
                  <div>
                    10% off is ready to use{tier1ActiveAward.code ? ` - code: ${tier1ActiveAward.code}` : ''}.
                  </div>
                </div>
              )}
            </footer>
          )}
        </article>
      </div>

      <div className="grid cols-3 tiers-grid">
        <article className="card tier-card">
          <div className="badge">Tier 1</div>
          <h4>3 Punches -> 10% Off</h4>
          <p className="muted">Automatically issued as a promo after 3 punches.</p>
        </article>

        <article className="card tier-card dim">
          <div className="badge">Tier 2</div>
          <h4>Coming Soon</h4>
          <p className="muted">More savings as you keep washing with us.</p>
        </article>

        <article className="card tier-card dim">
          <div className="badge">Tier 3</div>
          <h4>Coming Soon</h4>
          <p className="muted">Big perks for regulars & contracts.</p>
        </article>
      </div>

      <p className="tiny muted" style={{marginTop:16}}>
        Present at service. One punch per visit. Non-transferable. Rewards subject to verification.
      </p>
    </section>
  )
}
