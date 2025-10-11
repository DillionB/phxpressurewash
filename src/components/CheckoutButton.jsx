// src/components/CartSummary.jsx
import React, { useState } from 'react'
import { useCart } from '../state/CartContext'
import { supabase } from '../lib/supabase'

export default function CartSummary() {
  const { items, subtotal, removeItem, clearCart } = useCart()
  const [sending, setSending] = useState(false)
  const [note, setNote] = useState('')

  const toCheckout = async () => {
    setNote('')
    if (!items || items.length === 0) {
      setNote('Your cart is empty.')
      return
    }

    // Normalize cart lines to unit prices in cents (Stripe requires unit_amount).
    const normalized = items.map(l => {
      const qty = Math.max(1, Number(l.qty || 1))
      const total = Number(l.subtotal || 0) // your builder stores per-line total here
      const unit = total / qty
      return {
        title: l.title || 'Service',
        detail: l.detail || '',
        price_cents: Math.round(unit * 100),
        qty
      }
    })
    // Filter out zero-priced lines (quote-only)
    const billable = normalized.filter(x => Number.isFinite(x.price_cents) && x.price_cents > 0 && x.qty > 0)
    if (billable.length === 0) {
      setNote('All items are $0 — add a priced service first.')
      return
    }

    // Include Supabase access token so the function can attach user_id/email
    let accessToken = null
    try {
      const { data } = await supabase.auth.getSession()
      accessToken = data?.session?.access_token || null
    } catch { /* ignore */ }

    setSending(true)
    try {
      const resp = await fetch('/.netlify/functions/stripe-create-checkout-session', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ items: billable })
      })

      if (!resp.ok) {
        const t = await resp.text()
        console.error('Checkout start failed:', resp.status, t)
        setNote('Could not start checkout. Please try again.')
        return
      }

      const { url } = await resp.json()
      if (!url) {
        setNote('No checkout URL returned.')
        return
      }
      window.location = url
    } catch (e) {
      console.error('Checkout error:', e)
      setNote('Network error starting checkout.')
    } finally {
      setSending(false)
    }
  }

  return (
    <aside className="cart card" aria-label="Cart">
     

      <div className="cart-footer">
        <div><b>Subtotal</b></div>
        <div><b>${Number(subtotal || 0).toFixed(2)}</b></div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="cta" onClick={toCheckout} disabled={sending || items.length === 0}>
          {sending ? 'Starting checkout…' : 'Proceed to Secure Checkout'}
        </button>
        <button className="mini-btn" onClick={clearCart} disabled={sending || items.length === 0}>
          Clear
        </button>
      </div>

      <p className="small" style={{ marginTop: 8, opacity: .8 }}>
        Totals shown here are estimates. Final pricing confirmed after site assessment.
      </p>

      {note && (
        <p className="small" style={{ marginTop: 6, color: '#ffbda8' }}>
          {note}
        </p>
      )}
    </aside>
  )
}
