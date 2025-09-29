import React from 'react'
import { useCart } from '../state/CartContext'

export default function Industrial() {
    const { addItem } = useCart()
    return (
        <section className="wrap">
            <h2 className="section-title">Industrial Services</h2>
            <p className="section-sub">Warehouses, yards, equipment pads, fleet washdown.</p>
            <div className="builder card">
                <p className="small">Industrial jobs are bid after a site visit.</p>
                <button className="cta" onClick={() => addItem({ title: 'Industrial service (assessment)', detail: 'We will schedule a site visit', subtotal: 0, meta: ['quote'] })}>
                    Add to Cart (Request Assessment)
                </button>
            </div>
        </section>
    )
}
