import React, { useMemo, useState } from 'react'
import { useCart } from '../state/CartContext'
import {
    ADDON_FLAGS,
    PATIO_GROUND_OPTIONS, PATIO_BALCONY_OPTIONS,
    getPatioGroundPrice, getPatioBalconyPrice
} from '../pricing/pricing'

export default function PatioCleaningBuilder() {
    const { addItem } = useCart()
    const [ground, setGround] = useState(0)   // 0 = none
    const [balcony, setBalcony] = useState(0) // 0 = none
    const [addons, setAddons] = useState([])

    const currency = (v) => `$${(v || 0).toFixed(2)}`
    const groundPrice = useMemo(() => ground ? getPatioGroundPrice(ground) : 0, [ground])
    const balconyPrice = useMemo(() => balcony ? getPatioBalconyPrice(balcony) : 0, [balcony])

    const addToCart = () => {
        if (ground) {
            addItem({
                title: `Patio Cleaning — Ground level, up to ${ground} sqft`,
                detail: 'Concrete/pavers, ground level',
                subtotal: groundPrice, meta: []
            })
        }
        if (balcony) {
            addItem({
                title: `Patio Cleaning — Balcony, up to ${balcony} sqft`,
                detail: 'Upper level/balcony',
                subtotal: balconyPrice, meta: []
            })
        }
        if (addons.length) {
            addItem({
                title: 'Additional stain treatment (quoted)',
                detail: `Selected: ${addons.join(', ')}`,
                subtotal: 0, meta: []
            })
        }
    }

    const toggle = (label) =>
        setAddons(prev => prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label])

    return (
        <div className="builder card">
            <h3 style={{ marginTop: 0 }}>Patio Cleaning</h3>

            <div className="grid two">
                <div>
                    <label>Ground level patio</label>
                    <select value={ground} onChange={e => setGround(parseInt(e.target.value, 10))}>
                        <option value={0}>None</option>
                        {PATIO_GROUND_OPTIONS.map(o => {
                            const p = getPatioGroundPrice(o.value)
                            return <option key={o.value} value={o.value}>{`${o.label} (${currency(p)})`}</option>
                        })}
                    </select>
                    {ground > 0 && <div className="small muted">Est: {currency(groundPrice)}</div>}
                </div>

                <div>
                    <label>Balcony / upper-level patio</label>
                    <select value={balcony} onChange={e => setBalcony(parseInt(e.target.value, 10))}>
                        <option value={0}>None</option>
                        {PATIO_BALCONY_OPTIONS.map(o => {
                            const p = getPatioBalconyPrice(o.value)
                            return <option key={o.value} value={o.value}>{`${o.label} (${currency(p)})`}</option>
                        })}
                    </select>
                    {balcony > 0 && <div className="small muted">Est: {currency(balconyPrice)}</div>}
                </div>
            </div>

            <div className="addons">
                <label className="group-label">Additional services (quoted separately)</label>
                <div className="addon-chips">
                    {ADDON_FLAGS.map(label => {
                        const on = addons.includes(label)
                        return (
                            <label key={label} className={`chip ${on ? 'on' : ''}`}>
                                <input type="checkbox" checked={on} onChange={() => toggle(label)} />
                                <span>{label}</span>
                            </label>
                        )
                    })}
                </div>
                <p className="small tip" style={{ marginTop: 6 }}>
                    These require inspection. We’ll review photos and confirm pricing.
                </p>
            </div>

            <div className="builder-footer">
                <div>
                    <b>Estimated</b>{' '}
                    <span>{currency(groundPrice + balconyPrice)}</span>
                </div>
                <button className="cta" onClick={addToCart} disabled={!ground && !balcony}>Add to Cart</button>
            </div>
        </div>
    )
}
