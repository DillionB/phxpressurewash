import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../state/CartContext'
import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const PHONE = import.meta.env.VITE_BUSINESS_PHONE || ''

// --- Minimal inline SVG icons (stroke matches currentColor) ---
const Ico = {
    Excavator: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="17" width="11.5" height="3" rx="1.5" />
                <circle cx="7.2" cy="20" r="1.9" />
                <circle cx="13" cy="20" r="1.9" />
                <path d="M6 17v-3.4c0-.9.7-1.6 1.6-1.6H11l1.4 3v2" />
                <path d="M12.4 12.4l3-2.8 3 .9 2 3.9" />
                <path d="M18.4 10.6l1.8 3.6-1.1 1.1-3-1" />
                <path d="M20.2 14.2l.9 2.3-2 .6" />
            </g>
        </svg>
    ),
    SkidSteer: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="19.5" r="1.9" />
                <circle cx="14.5" cy="19.5" r="1.9" />
                <path d="M3 17h14l2-2-2-3H10l-2 2H6l-1-3" />
                <path d="M16 12h2l3 2-3 2h-2" />
                <path d="M5 10l1.5-2.5h4.5L13 10" />
            </g>
        </svg>
    ),
    Bulldozer: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="19.5" r="1.9" />
                <circle cx="13.5" cy="19.5" r="1.9" />
                <rect x="5" y="11" width="8.5" height="4" rx="1" />
                <path d="M3 17h12" />
                <path d="M13.5 12l6-1.5V17h-3" />
                <path d="M6.5 11v-2h3" />
            </g>
        </svg>
    ),
    DumpTruck: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="19.5" r="1.9" />
                <circle cx="15" cy="19.5" r="1.9" />
                <path d="M3 17h12l2-3-1-5H9l-2 2H3z" />
                <path d="M17 9h3l1 3-2 2h-2" />
            </g>
        </svg>
    ),
    Forklift: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="19.5" r="1.9" />
                <circle cx="14.5" cy="19.5" r="1.9" />
                <path d="M6 17V9h5l2 5v3" />
                <path d="M15 9v8" />
                <path d="M16.5 9H20v8" />
            </g>
        </svg>
    ),
    ScissorLift: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="19.5" r="1.8" />
                <circle cx="15" cy="19.5" r="1.8" />
                <path d="M4 17h14" />
                <path d="M6 8h10v2H6z" />
                <path d="M6 14l10-4M16 14L6 10" />
            </g>
        </svg>
    ),
    BoomLift: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="19.5" r="1.9" />
                <circle cx="14.5" cy="19.5" r="1.9" />
                <path d="M6 17h7l3-6 3 2" />
                <rect x="18" y="7" width="3" height="3" rx="0.6" />
            </g>
        </svg>
    ),
    WaterTruck: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="19.5" r="1.9" />
                <circle cx="15.5" cy="19.5" r="1.9" />
                <path d="M3 17h14l2-3v-4H9l-3 3H3z" />
                <path d="M13 10s2-2 3-2 1 2 1 2" />
            </g>
        </svg>
    ),
    Sweeper: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="19.5" r="1.9" />
                <circle cx="15.5" cy="19.5" r="1.9" />
                <path d="M3 17h14l2-2-2-3H9l-2 2H3z" />
                <path d="M4 21h3M8 21h3M12 21h3M16 21h3" />
            </g>
        </svg>
    ),
    Generator: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="8" width="14" height="8" rx="1.2" />
                <path d="M8 8v8M14 8v8" />
                <path d="M19 10v4" />
            </g>
        </svg>
    ),
    LightTower: () => (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="20" r="1.8" />
                <path d="M12 18v-6l3-3M12 12l-3-3" />
                <rect x="9" y="4" width="6" height="3" rx="0.6" />
            </g>
        </svg>
    ),
}

// --- Catalog with reasonable “per-unit wash” prices ---
const EQUIPMENT = [
    { id: 'excavator', label: 'Excavator', price: 180, Icon: Ico.Excavator },
    { id: 'skid', label: 'Skid Steer', price: 95, Icon: Ico.SkidSteer },
    { id: 'bulldozer', label: 'Bulldozer', price: 220, Icon: Ico.Bulldozer },
    { id: 'dump', label: 'Dump Truck', price: 140, Icon: Ico.DumpTruck },
    { id: 'forklift', label: 'Forklift', price: 85, Icon: Ico.Forklift },
    { id: 'scissor', label: 'Scissor Lift', price: 90, Icon: Ico.ScissorLift },
    { id: 'boom', label: 'Boom Lift', price: 130, Icon: Ico.BoomLift },
    { id: 'watertruck', label: 'Water Truck', price: 160, Icon: Ico.WaterTruck },
    { id: 'sweeper', label: 'Street Sweeper', price: 175, Icon: Ico.Sweeper },
    { id: 'generator', label: 'Tow Generator', price: 75, Icon: Ico.Generator },
    { id: 'lighttower', label: 'Light Tower', price: 70, Icon: Ico.LightTower },
]

// Site services with flat pricing
const SERVICES = [
    { id: 'concrete', label: 'Concrete Pad / Washout Clean', price: 250 },
    { id: 'contain', label: 'EPA Containment & Recovery', price: 120 },
    { id: 'degrease', label: 'Heavy Degreasing / Chem Boost', price: 80 },
    { id: 'fuelspill', label: 'Fuel / Oil Spill Cleanup', price: 220 },
    { id: 'trailer', label: 'Site Trailer Exterior Wash', price: 95 },
    { id: 'toilets', label: 'Portable Toilet Exterior Wash', price: 60 },
]

export default function Industrial() {
    const { addItem } = useCart()
    const navigate = useNavigate()
    const [mode, setMode] = useState('build') // 'build' | 'quote'

    // quantities map for equipment
    const [qty, setQty] = useState(() =>
        Object.fromEntries(EQUIPMENT.map(e => [e.id, 0]))
    )
    // selected site services
    const [svc, setSvc] = useState([])
    const [note, setNote] = useState('')
    const [sending, setSending] = useState(false)

    // Quote form state (only when mode === 'quote')
    const [form, setForm] = useState({
        business: '', address: '', city: '', state: '', zip: '',
        contact: '', phone: '', email: '', notes: '',
    })

    useEffect(() => { if (PUBLIC_KEY) emailjs.init(PUBLIC_KEY) }, [])

    const toggleSvc = (id) =>
        setSvc(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))

    const changeQty = (id, delta) =>
        setQty(q => {
            const next = Math.max(0, (q[id] || 0) + delta)
            return { ...q, [id]: next }
        })

    const formatUSD = (n) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

    const addSelectedToCart = () => {
        let added = 0
        EQUIPMENT.forEach(e => {
            const count = qty[e.id] || 0
            if (count > 0) {
                added++
                addItem({
                    title: `Equipment Wash — ${e.label} ×${count}`,
                    detail: `${formatUSD(e.price)} per unit`,
                    subtotal: e.price * count,
                    meta: ['industrial', 'equipment']
                })
            }
        })
        SERVICES.forEach(s => {
            if (svc.includes(s.id)) {
                added++
                addItem({
                    title: `Jobsite — ${s.label}`,
                    detail: 'Flat service',
                    subtotal: s.price,
                    meta: ['industrial', 'site-service']
                })
            }
        })
        setNote(added ? `✅ Added ${added} line item${added > 1 ? 's' : ''} to cart.` : 'Pick at least one item.')
    }

    // --- Quote form handlers ---
    const formatPhone = (val) => {
        const d = (val || '').replace(/\D/g, '').slice(0, 10)
        const p1 = d.slice(0, 3), p2 = d.slice(3, 6), p3 = d.slice(6, 10)
        return [p1, p2, p3].filter(Boolean).join('-')
    }
    const onFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const sendQuote = async (e) => {
        e.preventDefault()
        if (!form.business || !form.address) return setNote('Business and address are required.')
        if (!form.contact || !form.phone || !form.email) return setNote('Contact, phone, and email are required.')
        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
            return setNote('Email not configured. Add EmailJS keys to .env and restart.')
        }

        setSending(true); setNote('Sending…')
        try {
            const equipPicked = EQUIPMENT
                .map(e => ({ ...e, count: qty[e.id] || 0 }))
                .filter(e => e.count > 0)
                .map(e => `${e.label} ×${e.count} @ ${formatUSD(e.price)}`)
                .join(', ') || 'None selected'

            const svcPicked = SERVICES
                .filter(s => svc.includes(s.id))
                .map(s => `${s.label} (${formatUSD(s.price)})`)
                .join(', ') || 'None selected'

            const fullAddr = [form.address, form.city, form.state, form.zip].filter(Boolean).join(', ')

            const params = {
                from_name: form.contact,
                user_email: form.email,
                reply_to: form.email,

                business_name: form.business,
                customer_phone: form.phone,

                service_address: fullAddr,
                address_line: form.address,
                address_city: form.city,
                address_state: form.state,
                address_zip: form.zip,

                industrial_equipment: equipPicked,
                industrial_services: svcPicked,
                additional_notes: form.notes,
            }

            await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY)
            setNote('✅ Thanks! We received your request — we’ll follow up shortly.')
        } catch (err) {
            const msg = err?.text || err?.message || 'Unknown error'
            setNote(`⚠️ Send failed: ${msg}`)
        } finally {
            setSending(false)
        }
    }

    if (mode === 'quote') {
        // --- Quote mode (single card, compact) ---
        return (
            <section className="wrap" id="industrial-quote">
                <h2 className="section-title" style={{ marginBottom: 6 }}>Industrial Quote</h2>
                <p className="section-sub" style={{ marginBottom: 12 }}>
                    Select counts & services, then send us the site details for a fast quote.
                </p>

                <div className="card scheduler">
                    <form onSubmit={sendQuote}>
                        {/* Keep the last selected counts/services visible as a quick summary */}
                        <div className="full">
                            <div className="tiny muted" style={{ marginBottom: 8 }}>
                                Your selection will be included in the email.
                            </div>
                        </div>

                        <div className="full">
                            <label htmlFor="business">Business / Organization</label>
                            <input id="business" name="business" value={form.business} onChange={onFormChange} required />
                        </div>
                        <div className="full">
                            <label htmlFor="address">Service Address</label>
                            <input id="address" name="address" value={form.address} onChange={onFormChange} required />
                        </div>

                        <div><label htmlFor="city">City</label>
                            <input id="city" name="city" value={form.city} onChange={onFormChange} />
                        </div>
                        <div><label htmlFor="state">State</label>
                            <input id="state" name="state" value={form.state} onChange={onFormChange} />
                        </div>
                        <div><label htmlFor="zip">ZIP</label>
                            <input id="zip" name="zip" value={form.zip} onChange={onFormChange} />
                        </div>

                        <div><label htmlFor="contact">Contact Name</label>
                            <input id="contact" name="contact" value={form.contact} onChange={onFormChange} required />
                        </div>
                        <div><label htmlFor="phone">Phone</label>
                            <input
                                id="phone" type="tel" name="phone" inputMode="numeric" autoComplete="tel"
                                placeholder="xxx-xxx-xxxx" maxLength={12}
                                value={form.phone}
                                onChange={(e) => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
                                required
                            />
                        </div>
                        <div className="full"><label htmlFor="email">Email</label>
                            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={onFormChange} required />
                        </div>

                        <div className="full"><label htmlFor="notes">Notes</label>
                            <textarea
                                id="notes" name="notes" value={form.notes} onChange={onFormChange}
                                placeholder="Surfaces, timing, hazards, water access, other requests."
                            />
                        </div>

                        <div className="builder-footer" style={{ paddingTop: 8 }}>
                            <div className="tiny muted">{note}</div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button className="mini-btn" type="button" onClick={() => setMode('build')}>Back</button>
                                <button className="cta" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send Quote Request'}</button>
                                {PHONE ? (
                                    <a className="mini-btn" href={`tel:${PHONE}`}>Call Now</a>
                                ) : (
                                    <button className="mini-btn" type="button" onClick={() => navigate('/contact')}>Call Now</button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </section>
        )
    }

    // --- Build mode (add to cart) ---
    return (
        <section className="wrap" id="industrial-build">
            <h2 className="section-title">Industrial Services</h2>
            <p className="section-sub">
                Pick equipment counts and jobsite services. Add to cart or request a quote.
            </p>

            {/* Equipment grid */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Equipment Washdown</h3>
                <div className="equip-grid">
                    {EQUIPMENT.map(({ id, label, price, Icon }) => {
                        const count = qty[id] || 0
                        return (
                            <div key={id} className="equip-card">
                                <div className="ico"><Icon /></div>
                                <div className="equip-title">{label}</div>
                                <div className="equip-price">{formatUSD(price)} <span className="tiny muted">/ unit</span></div>
                                <div className="qty">
                                    <button type="button" className="mini-btn" onClick={() => changeQty(id, -1)} aria-label={`decrease ${label}`}>–</button>
                                    <span className="qty-num" aria-live="polite">{count}</span>
                                    <button type="button" className="mini-btn" onClick={() => changeQty(id, +1)} aria-label={`increase ${label}`}>+</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Site services */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Jobsite Services</h3>
                <div className="addon-chips">
                    {SERVICES.map(s => {
                        const on = svc.includes(s.id)
                        return (
                            <button
                                key={s.id}
                                type="button"
                                className={`chip ${on ? 'on' : ''}`}
                                onClick={() => toggleSvc(s.id)}
                                aria-pressed={on}
                                title={`${s.label} — ${formatUSD(s.price)}`}
                            >
                                {s.label} <span className="tiny muted" style={{ marginLeft: 6 }}>{formatUSD(s.price)}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Footer actions */}
            <div className="builder-footer">
                <div className="tiny muted">{note}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="cta" type="button" onClick={addSelectedToCart}>Add Selected to Cart</button>
                    <button className="mini-btn" type="button" onClick={() => setMode('quote')}>Request a Quote</button>
                    {PHONE ? (
                        <a className="mini-btn" href={`tel:${PHONE}`}>Call Now</a>
                    ) : (
                        <button className="mini-btn" type="button" onClick={() => navigate('/contact')}>Call Now</button>
                    )}
                </div>
            </div>
        </section>
    )
}
