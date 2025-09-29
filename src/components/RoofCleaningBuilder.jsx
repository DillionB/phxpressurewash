import React, { useMemo, useState } from 'react'
import { useCart } from '../state/CartContext'
import {
    ADDON_FLAGS,
    ROOF_OPTIONS, getRoofCleaningPrice
} from '../pricing/pricing'

export default function RoofCleaningBuilder() {
    const { addItem } = useCart()
    const [stories, setStories] = useState(1)
    const [sqft, setSqft] = useState(ROOF_OPTIONS[0].value)
    const [addons, setAddons] = useState([])

    const currency = (v) => `$${(v || 0).toFixed(2)}`
    const price = useMemo(() => getRoofCleaningPrice(stories, sqft), [stories, sqft])

    const addToCart = () => {
        addItem({
            title: `Roof Cleaning — ${stories}-story, up to ${sqft} sqft`,
            detail: 'Soft-wash roof (tile/shingle)',
            subtotal: price,
            meta: addons
        })
        if (addons.length) {
            addItem({
                title: 'Additional stain treatment (quoted)',
                detail: `Selected: ${addons.join(', ')}`,
                subtotal: 0,
                meta: []
            })
        }
    }

    const toggle = (label) =>
        setAddons(prev => prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label])

    return (
        <div className="builder card">
            <h3 style={{ marginTop: 0 }}>Roof Cleaning</h3>

            <div className="grid two">
                <div>
                    <label>Stories</label>
                    <select value={stories} onChange={e => setStories(parseInt(e.target.value, 10))}>
                        <option value={1}>1-story</option>
                        <option value={2}>2-story</option>
                    </select>
                </div>
                <div>
                    <label>Roof size</label>
                    <select value={sqft} onChange={e => setSqft(parseInt(e.target.value, 10))}>
                        {ROOF_OPTIONS.map(o => {
                            const p = getRoofCleaningPrice(stories, o.value)
                            return <option key={o.value} value={o.value}>{`${o.label} (${currency(p)})`}</option>
                        })}
                    </select>
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
                <div><b>Estimated</b> <span>{currency(price)}</span></div>
                <button className="cta" onClick={addToCart}>Add to Cart</button>
            </div>
        </div>
    )
}
