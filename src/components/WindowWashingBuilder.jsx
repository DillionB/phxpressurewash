import React, { useMemo, useState } from 'react'
import { useCart } from '../state/CartContext'
import {
    WINDOW_VARIANTS, WINDOW_SIZE_OPTIONS, getWindowPrice,
    BUG_SCREEN_COUNTS, SOLAR_SCREEN_COUNTS, SCREEN_DOOR_COUNTS,
    getBugScreenPrice, getSolarScreenPrice, getScreenDoorPrice
} from '../pricing/pricing'

export default function WindowWashingBuilder() {
    const { addItem } = useCart()

    const [variant, setVariant] = useState('solid_ext_1')
    const [sqft, setSqft] = useState(WINDOW_SIZE_OPTIONS[0].value)

    const [bugScreens, setBugScreens] = useState(0)
    const [solarScreens, setSolarScreens] = useState(0)
    const [screenDoors, setScreenDoors] = useState(0)

    const priceMain = useMemo(() => getWindowPrice(variant, sqft), [variant, sqft])
    const priceBug = useMemo(() => bugScreens ? getBugScreenPrice(bugScreens) : 0, [bugScreens])
    const priceSolar = useMemo(() => solarScreens ? getSolarScreenPrice(solarScreens) : 0, [solarScreens])
    const priceDoor = useMemo(() => screenDoors ? getScreenDoorPrice(screenDoors) : 0, [screenDoors])
    const total = priceMain + priceBug + priceSolar + priceDoor

    const currency = v => '$' + (v || 0).toFixed(2)

    const addToCart = () => {
        const vLabel = WINDOW_VARIANTS[variant]?.label || 'Window Washing'
        addItem({
            title: vLabel,
            detail: 'Size: ' + WINDOW_SIZE_OPTIONS.find(o => o.value === sqft)?.label,
            subtotal: priceMain,
            meta: []
        })
        if (bugScreens) {
            addItem({
                title: 'Bug Screen Cleaning + UV Protectant',
                detail: bugScreens + ' screen(s)',
                subtotal: priceBug, meta: []
            })
        }
        if (solarScreens) {
            addItem({
                title: 'Solar Screen Cleaning + UV Protectant',
                detail: solarScreens + ' screen(s)',
                subtotal: priceSolar, meta: []
            })
        }
        if (screenDoors) {
            addItem({
                title: 'Screen Door Cleaning + UV Protectant',
                detail: screenDoors + ' door(s)',
                subtotal: priceDoor, meta: []
            })
        }
    }

    return (
        <div className="builder card">
            <h3 style={{ marginTop: 0 }}>Window Washing</h3>

            <div className="grid two">
                <div>
                    <label>Service type</label>
                    <select value={variant} onChange={e => setVariant(e.target.value)}>
                        <optgroup label="Solid Pane">
                            <option value="solid_ext_1">Exterior Only (1 Story)</option>
                            <option value="solid_inext_1">Interior & Exterior (1 Story)</option>
                            <option value="solid_ext_2">Exterior Only (2 Story)</option>
                            <option value="solid_inext_2">Interior & Exterior (2 Story)</option>
                        </optgroup>
                        <optgroup label="French Pane">
                            <option value="french_ext_1">Exterior Only (1 Story)</option>
                            <option value="french_inext_1">Interior & Exterior (1 Story)</option>
                            <option value="french_ext_2">Exterior Only (2 Story)</option>
                            <option value="french_inext_2">Interior & Exterior (2 Story)</option>
                        </optgroup>
                    </select>
                    <div className="small muted">Est: {currency(priceMain)}</div>
                </div>

                <div>
                    <label>Home size</label>
                    <select value={sqft} onChange={e => setSqft(parseInt(e.target.value, 10))}>
                        {WINDOW_SIZE_OPTIONS.map(o => {
                            const p = getWindowPrice(variant, o.value)
                            return <option key={o.value} value={o.value}>{`${o.label} (${currency(p)})`}</option>
                        })}
                    </select>
                </div>

                <div>
                    <label>Bug screens (+ UV)</label>
                    <select value={bugScreens} onChange={e => setBugScreens(parseInt(e.target.value, 10))}>
                        <option value={0}>None</option>
                        {BUG_SCREEN_COUNTS.map(c => (
                            <option key={c} value={c}>{`${c} screen${c > 1 ? 's' : ''} (${currency(getBugScreenPrice(c))})`}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Solar screens (+ UV)</label>
                    <select value={solarScreens} onChange={e => setSolarScreens(parseInt(e.target.value, 10))}>
                        <option value={0}>None</option>
                        {SOLAR_SCREEN_COUNTS.map(c => (
                            <option key={c} value={c}>{`${c} screen${c > 1 ? 's' : ''} (${currency(getSolarScreenPrice(c))})`}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Screen doors (+ UV)</label>
                    <select value={screenDoors} onChange={e => setScreenDoors(parseInt(e.target.value, 10))}>
                        <option value={0}>None</option>
                        {SCREEN_DOOR_COUNTS.map(c => (
                            <option key={c} value={c}>{`${c} door${c > 1 ? 's' : ''} (${currency(getScreenDoorPrice(c))})`}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="builder-footer">
                <div><b>Estimated total</b> <span>{currency(total)}</span></div>
                <button className="cta" onClick={addToCart} disabled={priceMain <= 0}>Add to Cart</button>
            </div>
        </div>
    )
}
