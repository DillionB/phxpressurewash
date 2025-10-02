import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Orders({ compact = false }) {
  const [orders, setOrders] = useState(null)
  const [session, setSession] = useState(null)

  useEffect(() => {
  const reload = () => loadOrders()
  window.addEventListener('orders:refresh', reload)
  return () => window.removeEventListener('orders:refresh', reload)
}, [])


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
    // --- Build a query LIMITED to the signed-in user's rows ---
    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) {
      setOrders([])
      return
    }

    // Select the columns you actually have. (If you later add a "currency"
    // column, you can include it here and in the render.)
    let q = supabase
      .from('orders')
      .select('id, status, amount_cents, created_at, payment_intent, stripe_checkout_id')

    // Filter to "my" orders either by user_id or by email (RLS will still enforce)
    if (user.id && user.email) {
      q = q.or(`user_id.eq.${user.id},email.eq.${user.email}`)
    } else if (user.id) {
      q = q.eq('user_id', user.id)
    } else if (user.email) {
      q = q.eq('email', user.email)
    }

    // Try to fetch
    let resp = await q
    if (resp.error) {
      console.warn('orders fetch error:', resp.error)
      setOrders([])
      return
    }

    let ords = resp.data || []
    // Client-side sort newest first
    ords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setOrders(ords)

    // Fetch items in a second call and stitch them in
    if (ords.length > 0) {
      const ids = ords.map(o => o.id)
      const itemsResp = await supabase
        .from('order_items')
        .select('id, order_id, title, detail, unit_amount_cents, qty')
        .in('order_id', ids)

      if (itemsResp.error) {
        console.warn('order_items fetch error:', itemsResp.error)
        return
      }

      const byOrder = {}
      for (const it of (itemsResp.data || [])) {
        (byOrder[it.order_id] ||= []).push(it)
      }
      setOrders(ords.map(o => ({ ...o, order_items: byOrder[o.id] || [] })))
    }
  }

  // Optional realtime refresh when new orders insert (webhook)
  useEffect(() => {
    if (!session?.user) return
    const ch = supabase
      .channel('orders_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
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
            <div><b>Total:</b> ${(o.amount_cents / 100).toFixed(2)}</div>
            <div><b>Date:</b> {new Date(o.created_at).toLocaleString()}</div>
            <div style={{ color: '#8fb', fontSize: 12 }}>
              Stripe Ref: {o.payment_intent || o.stripe_checkout_id}
            </div>
            {o.order_items && o.order_items.length > 0 && (
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
