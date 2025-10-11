// src/pages/Commercial.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const PHONE = import.meta.env.VITE_BUSINESS_PHONE || '' // optional tel: CTA

export default function Commercial() {
    const navigate = useNavigate()

    // Emoji-tagged service options
    const serviceOptions = useMemo(
        () => [
            { id: 'power_wash', label: '⚡ Power Washing' },
            { id: 'building_wash', label: '🏢 Building Washing' },
            { id: 'windows', label: '🪟 Window Washing' },
            { id: 'sidewalks', label: '🚶 Sidewalk Cleaning' },
            { id: 'gum', label: '🍬 Gum Removal' },
            { id: 'graffiti', label: '🎨 Graffiti Removal' },
            { id: 'street_sweep', label: '🧹 Street Sweeping' },
            { id: 'lot_sweep', label: '🅿️ Parking Lot Sweeping' },
            { id: 'porter', label: '🧑‍🔧 Day Porter' },
            { id: 'fleet', label: '🚛 Fleet Washing' },
            { id: 'roof', label: '🏠 Roof Cleaning' },
            { id: 'garages', label: '🅿️ Parking Garages' },
            { id: 'gutters', label: '🌀 Gutter Cleaning' },
            { id: 'dumpster', label: '🗑️ Dumpster Pads' },
            { id: 'carts', label: '🛒 Shopping Carts' },
            { id: 'awning', label: '🏬 Awning Cleaning' },
        ],
        []
    )

    const [selected, setSelected] = useState([]) // array of ids

    const [form, setForm] = useState({
        business: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        footage: '',
        frequency: 'one-time', // one-time | monthly | quarterly | semi-annual | annual
        access: 'business-hours', // business-hours | after-hours | flexible
        notes: '',
    })

    const [note, setNote] = useState('')
    const [sending, setSending] = useState(false)

    useEffect(() => {
        if (PUBLIC_KEY) emailjs.init(PUBLIC_KEY)
        if (import.meta.env.DEV) {
            const tail = (s) => (s ? s.slice(-4) : 'NONE')
            // eslint-disable-next-line no-console
            console.log('EmailJS env ->', {
                service: tail(SERVICE_ID),
                template: tail(TEMPLATE_ID),
                pub: tail(PUBLIC_KEY),
            })
        }
    }, [])

    const formatPhone = (val) => {
        const d = (val || '').replace(/\D/g, '').slice(0, 10)
        const p1 = d.slice(0, 3)
        const p2 = d.slice(3, 6)
        const p3 = d.slice(6, 10)
        return [p1, p2, p3].filter(Boolean).join('-')
    }

    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

    const toggleService = (id) =>
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

    const onSubmit = async (e) => {
        e.preventDefault()
        // Basic validation
        if (!form.business || !form.contact || !form.phone || !form.email || !form.address) {
            setNote('Please complete business, contact, phone, email, and address.')
            return
        }
        if (!selected.length) {
            setNote('Please select at least one service.')
            return
        }
        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
            setNote('Email is not configured. Add EmailJS keys in .env and restart.')
            return
        }

        setSending(true)
        setNote('Sending...')

        try {
            const selectedLabels = serviceOptions
                .filter((o) => selected.includes(o.id))
                .map((o) => o.label)
                .join(', ')

            const addressFull = [form.address, form.city, form.state, form.zip]
                .filter(Boolean)
                .join(', ')

            const templateParams = {
                // who
                from_name: form.contact,
                user_email: form.email,
                reply_to: form.email,

                // business + contact
                business_name: form.business,
                customer_phone: form.phone,

                // location
                service_address: addressFull,
                address_line: form.address,
                address_city: form.city,
                address_state: form.state,
                address_zip: form.zip,

                // scope
                sqft_estimate: form.footage,
                frequency: form.frequency,
                access_window: form.access,
                commercial_services: selectedLabels,
                additional_notes: form.notes,
            }

            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)

            setNote('✅ Thanks! We received your request. We will follow up shortly.')
            // Optional: route to /contact thank-you, or keep here
            // navigate('/contact?thanks=1')
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('EmailJS error:', err)
            const msg = err?.text || err?.message || 'Unknown error'
            setNote(`⚠️ Send failed: ${msg}`)
        } finally {
            setSending(false)
        }
    }

    return (
        <section className="wrap" id="commercial-quote">
            <h2 className="section-title">Commercial Services</h2>
            <p className="section-sub">
                Storefronts, centers, HOAs, and facilities. Choose your services, add your site info, and we will quote fast.
            </p>

            <div className="card" style={{ marginBottom: 18 }}>
                <h3 style={{ margin: '0 0 8px' }}>Select services</h3>
                <div className="addon-chips" role="list">
                    {serviceOptions.map((opt) => {
                        const on = selected.includes(opt.id)
                        return (
                            <button
                                type="button"
                                className={`chip ${on ? 'on' : ''}`}
                                key={opt.id}
                                onClick={() => toggleService(opt.id)}
                                aria-pressed={on}
                                title={opt.label}
                            >
                                {opt.label}
                            </button>
                        )
                    })}
                </div>
                <p className="tiny muted" style={{ marginTop: 8 }}>
                    Tip: You can pick multiple services.
                </p>
            </div>

            <div className="card scheduler">
                <h3 style={{ marginTop: 0 }}>Request a quote</h3>
                <form onSubmit={onSubmit}>
                    <div className="full">
                        <label htmlFor="business">Business or Organization</label>
                        <input
                            id="business"
                            name="business"
                            value={form.business}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="contact">Contact Name</label>
                        <input
                            id="contact"
                            name="contact"
                            value={form.contact}
                            onChange={onChange}
                            required
                        />
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
                            onChange={(e) =>
                                setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))
                            }
                            required
                        />
                    </div>
                    <div className="full">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className="full">
                        <label htmlFor="address">Service Address</label>
                        <input
                            id="address"
                            name="address"
                            value={form.address}
                            onChange={onChange}
                            required
                        />
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
                        <select
                            id="frequency"
                            name="frequency"
                            value={form.frequency}
                            onChange={onChange}
                        >
                            <option value="one-time">One-time</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="semi-annual">Semi-annual</option>
                            <option value="annual">Annual</option>
                        </select>
                    </div>
                    <div className="full">
                        <label htmlFor="access">Access Window</label>
                        <select
                            id="access"
                            name="access"
                            value={form.access}
                            onChange={onChange}
                        >
                            <option value="business-hours">Business hours</option>
                            <option value="after-hours">After hours</option>
                            <option value="flexible">Flexible</option>
                        </select>
                    </div>

                    <div className="full">
                        <label htmlFor="notes">Notes</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={form.notes}
                            onChange={onChange}
                            placeholder="Surfaces, access instructions, hazards, water, special requests."
                        />
                    </div>

                    <div className="full" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button className="cta" type="submit" disabled={sending}>
                            {sending ? 'Sending...' : 'Send Quote Request'}
                        </button>

                        {PHONE ? (
                            <a className="mini-btn" href={`tel:${PHONE}`}>Call Now</a>
                        ) : (
                            <button className="mini-btn" type="button" onClick={() => navigate('/contact')}>
                                Call Now
                            </button>
                        )}

                        <span className="small" style={{ marginLeft: 6 }}>{note}</span>
                    </div>
                </form>
            </div>

            <div className="card" style={{ marginTop: 18 }}>
                <h4 style={{ margin: '0 0 8px' }}>What happens next</h4>
                <ul className="muted" style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                    <li>We confirm scope (sq ft, surfaces, access windows, water, hazards).</li>
                    <li>You receive a written quote and schedule options.</li>
                    <li>We can set up recurring service for storefronts, centers, and HOAs.</li>
                </ul>
            </div>
        </section>
    )
}
