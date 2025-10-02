import React, { useState } from 'react'
import Account from '../components/Account.jsx'
import Orders from '../components/Orders.jsx'
import Rewards from '../components/Rewards.jsx'

export default function AccountPage() {
  const [tab, setTab] = useState('profile') // 'profile' | 'orders' | 'rewards'

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
            onClick={() => setTab(v)}
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
