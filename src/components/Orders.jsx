import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Orders() {
    const [orders, setOrders] = useState(null)
    const [userEmail, setUserEmail] = useState(null)

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUserEmail(user?.email || null)
            if (!user) return
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
            if (!error) setOrders(data)
        })()
    }, [])

    if (!userEmail) {
        return (
            <div id="orders" className="wrap">
                <h2 className="section-title">My Orders</h2>
                <p className="section-sub">Sign in to view your orders.</p>
            </div>
        )
    }

    return (
        <section id="orders" className="wrap">
            <h2 className="section-title">My Orders</h2>
            {!orders && <p className="section-sub">Loading…</p>}
            {orders && orders.length === 0 && <p className="section-sub">No orders yet.</p>}
            <div className="grid">
                {(orders || []).map(o => (
                    <div key={o.id} className="card" style={{ marginBottom: 12 }}>
                        <div><b>Status:</b> {o.status}</div>
                        <div><b>Total:</b> ${(o.amount_cents / 100).toFixed(2)}</div>
                        <div><b>Date:</b> {new Date(o.created_at).toLocaleString()}</div>
                        <div style={{ color: '#8fb', fontSize: 12 }}>Stripe Ref: {o.payment_intent || o.stripe_checkout_id}</div>
                    </div>
                ))}
            </div>
        </section>
    )
}
