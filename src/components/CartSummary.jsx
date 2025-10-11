// src/components/CartSummary.jsx
import React from 'react'
import { useCart } from '../state/CartContext'
import CheckoutButton from './CheckoutButton.jsx'

export default function CartSummary() {
    const { items, subtotal, removeItem } = useCart()

    const fmt = (n) => (n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })

    return (
        <aside className="cart card cart-compact" aria-label="Cart">
            <div className="cart-head">
                <h3 className="cart-title">Your Cart</h3>
                <span className="cart-count" aria-label={`${items.length} items in cart`}>
                    {items.length}
                </span>
            </div>

            {items.length === 0 && (
                <p className="small muted" style={{ margin: 0 }}>No items yet.</p>
            )}

            {/* Scroll area */}

            {/* Sticky-ish footer */}
            <div className="cart-footer-row" aria-live="polite">
                <span>Subtotal</span>
                <b>{fmt(subtotal)}</b>
            </div>

            <CheckoutButton className="cta cart-checkout-btn" />

            <p className="tiny muted cart-note">
                Totals are estimates. Final pricing confirmed after site assessment.
            </p>
        </aside>
    )
}
