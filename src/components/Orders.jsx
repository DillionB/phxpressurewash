import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Orders({ compact = false }) {
  const [orders, setOrders] = useState(null)
  const [session, setSession] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const ses = data?.session || null
      setSession(ses)
      if (ses?.user) await loadOrders()
    }
    const sub = supabase.auth.onAuthStateChange((_evt, ses) => {
      setSession(ses || null)
      if (ses?.user) loadOrders()
      else setOrders(null)
    })
    init()
    return () => sub?.data?.subscription?.unsubscribe()
  }, [])

  async function loadOrders() {
    // 1) fetch orders only (no join, safe)
    const { data: ords, error: ordErr } = await supabase
      .from('orders')
      .select('id, status, amount_cents, currency, created_at, payment_intent, stripe_checkout_id')
      .order('created_at', { ascending: false })

    if (ordErr) {
      console.error('orders fetch error:', ordErr)
      setOrders([])
      return
    }
    if (!ords || ords.length === 0) {
      setOrders([])
      return
    }

    // 2) fetch items for those orders in a second query
    const ids = ords.map(o => o.id)
    const { data: items, error: itemErr } = await supabase
      .from('order_items')
      .select('id, order_id, title, detail, unit_amount_cents, qty')
      .in('order_id', ids)

    if (itemErr) {
      console.error('order_items fetch error:', itemErr)
    }

    // 3) group items by order_id
    const byOrder = {}
    for (const it of (items || [])) {
      if (!byOrder[it.order_id]) byOrder[it.order_id] = []
      byOrder[it.order_id].push(it)
    }

    // 4) attach to orders
    const merged = ords.map(o => ({ ...o, order_items: byOrder[o.id] || [] }))
    setOrders(merged)
  }

  // Optional: realtime refresh after webhook inserts an order
  useEffect(() => {
    if (!session?.user) return
    const ch = supabase
      .channel('orders_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        // RLS ensures we only get our own rows
        loadOrders()
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [session?.user?.id])

  if (!session?.user) {
    return (
      <div id="orders" className="wrap">
        <h2 className="section-title">My Orders</h2>
        <p className="section-sub">Sign in to view your orders.</p>
      </div>
    )
  }

  return (
    <section id="orders" className="wrap">
      {!compact && <h2 className="section-title">My Orders</h2>}
      {!orders && <p className="section-sub">Loading…</p>}
      {orders && orders.length === 0 && <p className="section-sub">No orders yet.</p>}

      <div className="grid">
        {(orders || []).map(o => (
          <div key={o.id} className="card" style={{ marginBottom: 12 }}>
            <div><b>Status:</b> {o.status}</div>
            <div><b>Total:</b> ${(o.amount_cents / 100).toFixed(2)} {o.currency?.toUpperCase()}</div>
            <div><b>Date:</b> {new Date(o.created_at).toLocaleString()}</div>
            <div style={{ color: '#8fb', fontSize: 12 }}>
              Stripe Ref: {o.payment_intent || o.stripe_checkout_id}
            </div>

            {o.order_items.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <b>Items</b>
                <ul style={{ margin: '6px 0 0 18px' }}>
                  {o.order_items.map(it => (
                    <li key={it.id}>
                      {it.title} — {it.qty} × ${(it.unit_amount_cents / 100).toFixed(2)}
                      {it.detail ? <span style={{ opacity: .8 }}> — {it.detail}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
