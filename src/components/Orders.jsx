import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Orders({ compact = false }) {
  const [orders, setOrders] = useState(null)
  const [session, setSession] = useState(null)

  useEffect(() => {
    let sub
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const ses = data?.session || null
      setSession(ses)
      if (ses?.user) await loadOrders()
    }
    sub = supabase.auth.onAuthStateChange((_evt, ses) => {
      setSession(ses || null)
      if (ses?.user) loadOrders()
      else setOrders(null)
    })
    init()
    return () => sub?.data?.subscription?.unsubscribe()
  }, [])

  async function loadOrders() {
    // RLS allows reading by user_id OR email (see DB policy),
    // so no need to filter here, but you can if you want:
    //   .eq('user_id', session.user.id)
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, amount_cents, currency, created_at, payment_intent, stripe_checkout_id, order_items(*)')
      .order('created_at', { ascending: false })
    if (!error) setOrders(data)
  }

  // Optional: Realtime updates when webhook inserts a new order
  useEffect(() => {
    if (!session?.user) return
    const channel = supabase
      .channel('orders_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          // RLS ensures we only receive visible rows (user_id/email match)
          setOrders((prev) => [payload.new, ...(prev || [])])
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
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

            {o.order_items && o.order_items.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <b>Items</b>
                <ul style={{ margin: '6px 0 0 18px' }}>
                  {o.order_items.map((it) => (
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
