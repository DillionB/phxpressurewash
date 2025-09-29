import React from 'react'
import { useCart } from '../state/CartContext'
import { supabase } from '../lib/supabase'

export default function CheckoutButton({ className = 'cta' }) {
    const { cart } = useCart()

    const toCheckout = async () => {
        // get user (if signed in; it's OK if null)
        const { data: { user } } = await supabase.auth.getUser()

        const items = cart.map(l => ({
            title: l.title,
            detail: l.detail || '',
            unit_amount_cents: Math.round((l.subtotal || 0) * 100),
            qty: l.qty || 1
        })).filter(x => x.unit_amount_cents > 0)

        if (!items.length) {
            alert('Your cart is empty.')
            return
        }

        const resp = await fetch('/.netlify/functions/stripe-create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_email: user?.email || null,
                user_id: user?.id || null,
                items
            })
        })
        if (!resp.ok) {
            alert('Could not start checkout.')
            return
        }
        const { url } = await resp.json()
        window.location = url
    }

    return (
        <button className={className} onClick={toCheckout}>
            Proceed to Secure Checkout
        </button>
    )
}
