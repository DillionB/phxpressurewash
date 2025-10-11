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
            {items.length > 0 && (
                <div className="cart-lines" role="list">
                    {items.map((item) => (
                        <div
                            key={item.id || `${item.title}-${Math.random()}`}
                            className="cart-line"
                            role="listitem"
                        >
                            <div className="cart-line-main">
                                <div className="cart-line-title">{item.title}</div>
                                {item.detail && <div className="cart-line-sub small">{item.detail}</div>}
                                {item.meta && item.meta.length > 0 && (
                                    <div className="cart-line-tags">
                                        {item.meta.map((m, i) => (
                                            <span className="tag-chip" key={`${m}-${i}`}>{m}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="cart-line-right">
                                <div className="cart-line-price">{fmt(item.subtotal)}</div>
                                <button
                                    className="cart-remove"
                                    aria-label={`Remove ${item.title}`}
                                    title="Remove"
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                >
                                    <svg
                                        width="16" height="16" viewBox="0 0 24 24"
                                        aria-hidden="true" focusable="false"
                                    >
                                        <path d="M18 6L6 18M6 6l12 12"
                                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>

                            </div>
                        </div>
                    ))}
                </div>
            )}
            <CheckoutButton className="cta cart-checkout-btn" />

            <p className="tiny muted cart-note">
                Totals are estimates. Final pricing confirmed after site assessment.
            </p>
        </aside>
    )
}
