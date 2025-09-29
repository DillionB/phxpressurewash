import React from 'react'
import { useCart } from '../state/CartContext'

export default function Commercial() {
    const { addItem } = useCart()
    return (
        <section className="wrap">
            <h2 className="section-title">Commercial Services</h2>
            <p className="section-sub">Storefronts, flatwork, dumpster pads, HOA common areas.</p>
            <div className="builder card">
                <p className="small">Commercial pricing varies by square footage and access windows.</p>
                <button className="cta" onClick={() => addItem({ title: 'Commercial service (assessment)', detail: 'We will confirm scope & quote', subtotal: 0, meta: ['quote'] })}>
                    Add to Cart (Request Assessment)
                </button>
            </div>
        </section>
    )
}
