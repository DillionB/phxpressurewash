import React, { useEffect, useState } from 'react'

export default function StripeReturn() {
  const [msg, setMsg] = useState(null)
  const [tone, setTone] = useState('ok') // ok | warn

  useEffect(() => {
    // Force apex to www so Supabase uses the same storage origin
    if (location.hostname === 'phxpressurewash.com') {
      location.replace(`https://www.phxpressurewash.com${location.pathname}${location.search}${location.hash}`)
      return
    }

    const qp = new URLSearchParams(window.location.search)
    if (qp.get('success') === '1') { setMsg('Payment received. We will confirm your appointment shortly.'); setTone('ok') }
    if (qp.get('canceled') === '1') { setMsg('Payment canceled. No charge made.'); setTone('warn') }
    if (qp.get('success') || qp.get('canceled')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (!msg) return null

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      padding: '10px 16px',
      background: tone === 'ok' ? 'rgba(38, 109, 91, 0.9)' : 'rgba(120, 85, 20, 0.9)',
      color: '#fff', borderBottom: '1px solid rgba(255,255,255,.2)'
    }}>
      {msg}
    </div>
  )
}
