import React, { useMemo, useState } from 'react'
import { useCart } from '../state/CartContext'
import {
    SIZE_OPTIONS, ADDON_FLAGS,
    getDrivewayPrice, getGaragePrice,
    getDrivewayTreatmentPrice, getGarageTreatmentPrice
} from '../pricing/pricing'

export default function DrivewayGarageBuilder() {
    const { addItem } = useCart()
    const [driveway, setDriveway] = useState(0)
    const [garage, setGarage] = useState(0)
    const [treatDriveway, setTreatDriveway] = useState(0)
    const [treatGarage, setTreatGarage] = useState(0)
    const [addons, setAddons] = useState([])

    const currency = (v) => `$${(v || 0).toFixed(2)}`
    const renderOptions = (getPriceFn, keyPrefix) =>
        SIZE_OPTIONS.map(o => {
            const label = o.value === 0 ? 'None' : `${o.label} (${currency(getPriceFn(o.value))})`
            return <option key={`${keyPrefix}-${o.value}`} value={o.value}>{label}</option>
        })

    const lines = useMemo(() => {
        const arr = []
        if (driveway > 0) {
            const price = getDrivewayPrice(driveway)
            arr.push({
                title: `Driveway Cleaning — ${driveway}-car`,
                detail: `Standard wash`,
                subtotal: price
            })
        }
        if (garage > 0) {
            const price = getGaragePrice(garage)
            arr.push({
                title: `Garage Cleaning — ${garage}-car`,
                detail: `Standard wash`,
                subtotal: price
            })
        }
        if (treatDriveway > 0) {
            const price = getDrivewayTreatmentPrice(treatDriveway)
            arr.push({
                title: `Driveway Oil Treatment — ${treatDriveway}-car`,
                detail: `Degrease & hot-water treatment`,
                subtotal: price
            })
        }
        if (treatGarage > 0) {
            const price = getGarageTreatmentPrice(treatGarage)
            arr.push({
                title: `Garage Oil Treatment — ${treatGarage}-car`,
                detail: `Degrease & hot-water treatment`,
                subtotal: price
            })
        }
        if (addons.length > 0) {
            arr.push({
                title: `Additional stain treatment (quoted)`,
                detail: `Selected: ${addons.join(', ')}`,
                subtotal: 0
            })
        }
        return arr
    }, [driveway, garage, treatDriveway, treatGarage, addons])

    const estTotal = lines.reduce((s, l) => s + l.subtotal, 0)

    const addToCart = () => {
        lines.forEach(l => addItem({ ...l, meta: [] }))
    }

    const toggleAddon = (label) => {
        setAddons(prev => prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label])
    }

    return (
        <div className="builder card">
            <h3 style={{ marginTop: 0 }}>Driveway / Garage</h3>

            <div className="grid two">
                <div>
                    <label>Driveway size</label>
                    <select value={driveway} onChange={e => setDriveway(parseInt(e.target.value, 10))}>
                        {renderOptions(getDrivewayPrice, 'dw')}
                    </select>
                    {driveway > 0 && <div className="small muted">Est: {currency(getDrivewayPrice(driveway))}</div>}
                </div>

                <div>
                    <label>Garage size</label>
                    <select value={garage} onChange={e => setGarage(parseInt(e.target.value, 10))}>
                        {renderOptions(getGaragePrice, 'ga')}
                    </select>
                    {garage > 0 && <div className="small muted">Est: {currency(getGaragePrice(garage))}</div>}
                </div>

                <div>
                    <label>Driveway oil treatment (optional)</label>
                    <select value={treatDriveway} onChange={e => setTreatDriveway(parseInt(e.target.value, 10))}>
                        {renderOptions(getDrivewayTreatmentPrice, 'tdw')}
                    </select>
                    {treatDriveway > 0 && <div className="small muted">Est: {currency(getDrivewayTreatmentPrice(treatDriveway))}</div>}
                </div>

                <div>
                    <label>Garage oil treatment (optional)</label>
                    <select value={treatGarage} onChange={e => setTreatGarage(parseInt(e.target.value, 10))}>
                        {renderOptions(getGarageTreatmentPrice, 'tga')}
                    </select>
                    {treatGarage > 0 && <div className="small muted">Est: {currency(getGarageTreatmentPrice(treatGarage))}</div>}
                </div>
            </div>

            <div className="addons">
                <label className="group-label">Additional services (quoted separately)</label>
                <div className="addon-chips">
                    {ADDON_FLAGS.map(label => {
                        const on = addons.includes(label)
                        return (
                            <label key={label} className={`chip ${on ? 'on' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={on}
                                    onChange={() => toggleAddon(label)}
                                />
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
                <div><b>Estimated total</b> <span>{currency(estTotal)}</span></div>
                <button className="cta" onClick={addToCart} disabled={lines.length === 0}>Add to Cart</button>
            </div>
        </div>
    )
}
