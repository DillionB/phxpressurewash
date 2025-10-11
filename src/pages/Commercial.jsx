import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_COMTEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const PHONE = import.meta.env.VITE_BUSINESS_PHONE || ''
 
export default function Commercial() {
    const navigate = useNavigate()

    // Full competitor list with emojis (buttons)
    const serviceOptions = useMemo(() => [
        { id: 'power', label: '💧 Pressure Washing' },
        { id: 'building', label: '🏢 Building Washing' },
        { id: 'windows', label: '🪟 Window Washing' },
        { id: 'sidewalk', label: '🚶 Sidewalk Cleaning' },
        { id: 'gum', label: '🍬 Gum Removal' },
        { id: 'graffiti', label: '🎨 Graffiti Removal' },
        { id: 'street', label: '🧹 Street Sweeping' },
        { id: 'porter', label: '🧑‍🔧 Day Porter' },
        { id: 'fleet', label: '🚚 Fleet Washing' },
        { id: 'garages', label: '🅿️ Parking Garages' },
        { id: 'gutter', label: '🪣 Gutter Cleaning' },
        { id: 'dumpster', label: '🗑️ Dumpster Pads' },
        { id: 'carts', label: '🛒 Shopping Carts' },
        { id: 'awning', label: '🏬 Awning Cleaning' },
    ], [])

    const [selected, setSelected] = useState([])
    const [note, setNote] = useState('')
    const [sending, setSending] = useState(false)
    const [form, setForm] = useState({
        business: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        footage: '',
        frequency: 'one-time', // one-time | monthly | quarterly | semi-annual | annual
        contact: '',
        phone: '',
        email: '',
        notes: '',
    })

    useEffect(() => {
        if (PUBLIC_KEY) emailjs.init(PUBLIC_KEY)
    }, [])

    const toggle = (id) =>
        setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))

    const formatPhone = (val) => {
        const d = (val || '').replace(/\D/g, '').slice(0, 10)
        const p1 = d.slice(0, 3), p2 = d.slice(3, 6), p3 = d.slice(6, 10)
        return [p1, p2, p3].filter(Boolean).join('-')
    }

    const onChange = (e) =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const send = async (e) => {
        e.preventDefault()
        if (selected.length === 0) return setNote('Pick at least one service.')
        if (!form.business || !form.address) return setNote('Business and address are required.')
        if (!form.contact || !form.phone || !form.email) return setNote('Contact, phone, and email are required.')
        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
            return setNote('Email not configured. Add EmailJS keys to .env and restart.')
        }

        setSending(true); setNote('Sending…')
        try {
            const selectedLabels = serviceOptions
                .filter(o => selected.includes(o.id))
                .map(o => o.label)
                .join(', ')

            const addressFull = [form.address, form.city, form.state, form.zip]
                .filter(Boolean).join(', ')

            const params = {
                from_name: form.contact,
                user_email: form.email,
                reply_to: form.email,

                business_name: form.business,
                customer_phone: form.phone,

                service_address: addressFull,
                address_line: form.address,
                address_city: form.city,
                address_state: form.state,
                address_zip: form.zip,

                sqft_estimate: form.footage,
                frequency: form.frequency,

                commercial_services: selectedLabels,
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

    return (
        <section className="wrap" id="commercial-quote">
            <h2 className="section-title" style={{ marginBottom: 6 }}>Commercial Services</h2>
            <p className="section-sub" style={{ marginBottom: 12 }}>
                One team for storefronts, centers, HOAs & facilities — quick quote, no hassle.
            </p>

            {/* Single compact card with EVERYTHING on one form */}
            <div className="card scheduler">
                <form onSubmit={send}>
                    {/* Options row (buttons) */}
                    <div className="full">
                        <h3 style={{ margin: '0 0 8px' }}>Select services</h3>
                        <div className="option-grid" role="group" aria-label="Services">
                            {serviceOptions.map(opt => {
                                const on = selected.includes(opt.id)
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        className={`option-btn ${on ? 'on' : ''}`}
                                        onClick={() => toggle(opt.id)}
                                        aria-pressed={on}
                                        title={opt.label}
                                    >
                                        {opt.label}
                                    </button>
                                )
                            })}
                        </div>
                        <p className="tiny muted" style={{ marginTop: 6 }}>
                            Need something not listed? Add it in notes below.
                        </p>
                    </div>

                    {/* Business & address */}
                    <div className="full">
                        <label htmlFor="business">Business / Organization</label>
                        <input id="business" name="business" value={form.business} onChange={onChange} required />
                    </div>

                    <div className="full">
                        <label htmlFor="address">Service Address</label>
                        <input id="address" name="address" value={form.address} onChange={onChange} required />
                    </div>

                    <div>
                        <label htmlFor="city">City</label>
                        <input id="city" name="city" value={form.city} onChange={onChange} />
                    </div>
                    <div>
                        <label htmlFor="state">State</label>
                        <input id="state" name="state" value={form.state} onChange={onChange} />
                    </div>
                    <div>
                        <label htmlFor="zip">ZIP</label>
                        <input id="zip" name="zip" value={form.zip} onChange={onChange} />
                    </div>

                    {/* Scope & frequency */}
                    <div>
                        <label htmlFor="footage">Approx. Sq Ft</label>
                        <input
                            id="footage"
                            name="footage"
                            inputMode="numeric"
                            placeholder="e.g., 12,000"
                            value={form.footage}
                            onChange={onChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="frequency">Frequency</label>
                        <select id="frequency" name="frequency" value={form.frequency} onChange={onChange}>
                            <option value="one-time">One-time</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="semi-annual">Semi-annual</option>
                            <option value="annual">Annual</option>
                        </select>
                    </div>

                    {/* Contact */}
                    <div>
                        <label htmlFor="contact">Contact Name</label>
                        <input id="contact" name="contact" value={form.contact} onChange={onChange} required />
                    </div>
                    <div>
                        <label htmlFor="phone">Phone</label>
                        <input
                            id="phone"
                            type="tel"
                            name="phone"
                            inputMode="numeric"
                            autoComplete="tel"
                            placeholder="xxx-xxx-xxxx"
                            maxLength={12}
                            value={form.phone}
                            onChange={(e) => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
                            required
                        />
                    </div>
                    <div className="full">
                        <label htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} required />
                    </div>

                    <div className="builder-footer" style={{ paddingTop: 8 }}>
                        <div className="tiny muted">{note}</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="cta" type="submit" disabled={sending}>
                                {sending ? 'Sending…' : 'Send Quote Request'}
                            </button>
                            {PHONE ? (
                                <a className="mini-btn" href={`tel:${PHONE}`}>Call Now</a>
                            ) : (
                                    <button className="mini-btn" type="button" onClick={() => navigate('/contact')}>Call Now 623-469-5994</button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </section>
    )
}
