import React, { useMemo, useState } from 'react'
import { useCart } from '../state/CartContext'
import {
    PANEL_OPTIONS, getPanelPrice, BIRD_DROPPING_FEE
} from '../pricing/pricing'

export default function SolarPanelBuilder() {
    const { addItem } = useCart()
    const [stories, setStories] = useState(1)          // 1 or 2
    const [panels, setPanels] = useState(PANEL_OPTIONS[0].value)
    const [bird, setBird] = useState(false)

    const priceMain = useMemo(() => getPanelPrice(stories, panels), [stories, panels])
    const total = priceMain + (bird ? BIRD_DROPPING_FEE : 0)
    const currency = v => '$' + (v || 0).toFixed(2)

    const addToCart = () => {
        addItem({
            title: `Solar Panel Cleaning - ${stories}-Story`,
            detail: PANEL_OPTIONS.find(o => o.value === panels)?.label || '',
            subtotal: priceMain,
            meta: []
        })
        if (bird) {
            addItem({
                title: 'Bird nests / heavy droppings fee',
                detail: 'Pressure wash + disposal',
                subtotal: BIRD_DROPPING_FEE,
                meta: []
            })
        }
    }

    return (
        <div className="builder card">
            <h3 style={{ marginTop: 0 }}>Solar Panel Washing</h3>

            <div className="grid two">
                <div>
                    <label>Stories</label>
                    <select value={stories} onChange={e => setStories(parseInt(e.target.value, 10))}>
                        <option value={1}>1-story</option>
                        <option value={2}>2-story</option>
                    </select>
                    <div className="small muted">Est: {currency(priceMain)}</div>
                </div>

                <div>
                    <label>Panel count</label>
                    <select value={panels} onChange={e => setPanels(parseInt(e.target.value, 10))}>
                        {PANEL_OPTIONS.map(o => {
                            const p = getPanelPrice(stories, o.value)
                            return <option key={o.value} value={o.value}>{`${o.label} (${currency(p)})`}</option>
                        })}
                    </select>
                </div>

                <div className="full">
                    <label className="check">
                        <input type="checkbox" checked={bird} onChange={e => setBird(e.target.checked)} />
                        <span>Birds nests / heavy droppings require pressure washing and a disposal fee (+{currency(BIRD_DROPPING_FEE)})</span>
                    </label>
                </div>
            </div>

            <div className="builder-footer">
                <div><b>Estimated total</b> <span>{currency(total)}</span></div>
                <button className="cta" onClick={addToCart}>Add to Cart</button>
            </div>
        </div>
    )
}
