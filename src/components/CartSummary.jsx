import React from 'react'
import { useCart } from '../state/CartContext'
import CheckoutButton from './CheckoutButton.jsx'

export default function CartSummary() {
    const { items, subtotal, removeItem, clearCart } = useCart()

    return (
        <aside className="cart card" aria-label="Cart">
            <h3 style={{ marginTop: 0 }}>Your Cart</h3>

            {items.length === 0 && <p className="small">No items yet.</p>}

            {items.map(item => (
                <div key={item.id || `${item.title}-${Math.random()}`} className="cart-line">
                    <div>
                        <b>{item.title}</b>
                        {item.detail && <div className="small">{item.detail}</div>}
                        {item.meta && item.meta.length > 0 &&
                            <div className="small">Notes: {item.meta.join(', ')}</div>}
                    </div>
                    <div className="cart-right">
                        <div>${(item.subtotal || 0).toFixed(2)}</div>
                        <button className="mini-btn" onClick={() => removeItem(item.id)}>Remove</button>
                    </div>
                </div>
            ))}

            <div className="cart-footer">
                <div><b>Subtotal</b></div>
                <div><b>${subtotal.toFixed(2)}</b></div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* Secure Stripe Checkout */}
                <CheckoutButton className="cta" />
                <button className="mini-btn" onClick={clearCart}>Clear</button>
            </div>

            <p className="small" style={{ marginTop: 8, opacity: .8 }}>
                Totals shown here are estimates. Final pricing confirmed after site assessment.
            </p>
        </aside>
    )
}
