// src/pages/AccountPage.jsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import Account from '../components/Account.jsx'
import Orders from '../components/Orders.jsx'
import Rewards from '../components/Rewards.jsx'
import AuthModal from '../components/AuthModal.jsx'

export default function AccountPage() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Determine initial tab from ?tab=... or #hash; fallback to 'profile'
  const getInitialTab = () => {
    const param = new URLSearchParams(location.search).get('tab')
    const hash = (location.hash || '').replace('#', '')
    const t = (param || hash || 'profile').toLowerCase()
    return ['profile', 'orders', 'rewards'].includes(t) ? t : 'profile'
  }

  const [tab, setTab] = useState(getInitialTab())

  // Keep tab state in sync if URL changes externally
  useEffect(() => {
    setTab(getInitialTab())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.hash])

  const changeTab = (v) => {
    setTab(v)
    const sp = new URLSearchParams(location.search)
    sp.set('tab', v)
    navigate({ pathname: '/account', search: sp.toString() }, { replace: true })
  }

  // Loading state
  if (loading) {
    return (
      <section className="wrap" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <h2 className="section-title">Account</h2>
        <p className="section-sub">Loading your account…</p>
      </section>
    )
  }

  // Not signed in: show Sign In / Create Account and no tabs
  if (!user) {
    return (
      <section className="wrap" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <h2 className="section-title">Sign In</h2>
        <p className="section-sub">
          Create an account or sign in to manage your profile, view orders, and track rewards.
        </p>
        <div className="card" style={{ maxWidth: 520 }}>
          <AuthModal />
        </div>
      </section>
    )
  }

  // Signed in: show tabbed account hub
  return (
    <div className="wrap" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <h2 className="section-title">My Account</h2>

      <div className="subtabs" style={{ marginBottom: 16 }}>
        {[
          ['profile', 'Profile'],
          ['orders', 'Orders'],
          ['rewards', 'Rewards'],
        ].map(([v, label]) => (
          <button
            key={v}
            className={`tab ${tab === v ? 'active' : ''}`}
            onClick={() => changeTab(v)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <Account />}
      {tab === 'orders' && <Orders />}
      {tab === 'rewards' && <Rewards />}
    </div>
  )
}
