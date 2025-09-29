import React from 'react'
import { useCart } from '../state/CartContext'
import { supabase } from '../lib/supabase'

export default function CheckoutButton({ className = 'cta' }) {
  const { items } = useCart() // <-- your context returns { items, subtotal, ... }

  const toCheckout = async () => {
    const lines = Array.isArray(items) ? items : []
    if (!lines.length) {
      alert('Your cart is empty.')
      return
    }

    // Get user (ok if not signed in)
    let user = null
    try {
      const res = await supabase.auth.getUser()
      user = res?.data?.user || null
    } catch {}

    // Build payload for the Netlify function
    const payload = {
      customer_email: user?.email || null,
      user_id: user?.id || null,
      items: lines
        .map(l => ({
          title: l.title || 'Service',
          detail: l.detail || '',
          unit_amount_cents: Math.round(Number(l.subtotal || 0) * 100),
          qty: Number(l.qty || 1)
        }))
        .filter(x => Number.isFinite(x.unit_amount_cents) && x.unit_amount_cents > 0)
    }

    if (!payload.items.length) {
      alert('All items are $0 — add a priced item first.')
      return
    }

    // Call your serverless function
    const resp = await fetch('/.netlify/functions/stripe-create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!resp.ok) {
      const t = await resp.text()
      console.error('Checkout start failed:', resp.status, t)
      alert('Could not start checkout.')
      return
    }
    const { url } = await resp.json()
    if (!url) {
      alert('No checkout URL returned.')
      return
    }
    window.location = url
  }

  return (
    <button className={className} onClick={toCheckout}>
      Proceed to Secure Checkout
    </button>
  )
}
