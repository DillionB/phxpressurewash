import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function StripeReturn() {
  const [msg, setMsg] = useState(null)
  const [tone, setTone] = useState('ok')

  useEffect(() => {
    const qp = new URLSearchParams(window.location.search)
    const success = qp.get('success') === '1'
    const canceled = qp.get('canceled') === '1'
    const session_id = qp.get('session_id')

    const cleanUrl = () => window.history.replaceState({}, document.title, window.location.pathname)

    if (success && session_id) {
      ;(async () => {
        try {
          // Send auth so we can attach the order to THIS user.
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token
          await fetch('/.netlify/functions/claim-order', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              ...(token ? { authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ session_id })
          })
          setMsg('? Payment received — we’ll confirm your appointment shortly.')
          setTone('ok')
          // Ask Orders component to reload
          window.dispatchEvent(new CustomEvent('orders:refresh'))
        } catch {
          setMsg('? Payment received. Your order will appear shortly.')
          setTone('ok')
        } finally {
          cleanUrl()
        }
      })()
    } else if (canceled) {
      setMsg('Payment canceled — no charge made.')
      setTone('warn')
      cleanUrl()
    }
  }, [])

  if (!msg) return null

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50, padding: '10px 16px',
      background: tone === 'ok' ? 'rgba(38, 109, 91, 0.9)' : 'rgba(120, 85, 20, 0.9)',
      color: '#fff', borderBottom: '1px solid rgba(255,255,255,.2)'
    }}>
      {msg}
    </div>
  )
}
