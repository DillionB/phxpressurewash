// src/pages/Commercial.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const PHONE = import.meta.env.VITE_BUSINESS_PHONE || ''

export default function Commercial() {
    const navigate = useNavigate()

    // Keep Step 1 concise so it fits on a single screen
    const serviceOptions = useMemo(
        () => [
            { id: 'power', label: '⚡ Power Washing' },
            { id: 'building', label: '🏢 Building Washing' },
            { id: 'windows', label: '🪟 Window Washing' },
            { id: 'sidewalk', label: '🚶 Sidewalk Cleaning' },
            { id: 'gum', label: '🍬 Gum Removal' },
            { id: 'graffiti', label: '🎨 Graffiti Removal' },
            { id: 'dumpster', label: '🗑️ Dumpster Pads' },
            { id: 'garage', label: '🅿️ Parking Garages' },
        ],
        []
    )

    const [step, setStep] = useState(1) // 1 Select services → 2 Site details → 3 Contact & send
    const [selected, setSelected] = useState([])
    const [note, setNote] = useState('')
    const [sending, setSending] = useState(false)

    const [form, setForm] = useState({
        // Step 2 fields
        business: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        footage: '',
        frequency: 'one-time',   // one-time | monthly | quarterly | semi-annual | annual
        access: 'business-hours',// business-hours | after-hours | flexible

        // Step 3 fields
        contact: '',
        phone: '',
        email: '',
        notes: '',
    })

    useEffect(() => {
        if (PUBLIC_KEY) emailjs.init(PUBLIC_KEY)
    }, [])

    const toggle = (id) =>
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

    const formatPhone = (val) => {
        const d = (val || '').replace(/\D/g, '').slice(0, 10)
        const p1 = d.slice(0, 3), p2 = d.slice(3, 6), p3 = d.slice(6, 10)
        return [p1, p2, p3].filter(Boolean).join('-')
    }

    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

    const next = () => {
        // lightweight guards per step (no scroll → keep it tight)
        if (step === 1 && selected.length === 0) {
            setNote('Pick at least one service.'); return
        }
        if (step === 2 && (!form.business || !form.address)) {
            setNote('Business and address are required.'); return
        }
        setNote('')
        setStep((s) => Math.min(3, s + 1))
    }
    const back = () => { setNote(''); setStep((s) => Math.max(1, s - 1)) }

    const send = async () => {
        if (!form.contact || !form.phone || !form.email) {
            setNote('Contact name, phone, and email are required.'); return
        }
        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
            setNote('Email not configured. Add EmailJS keys to .env and restart.'); return
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
                access_window: form.access,

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
            <p className="section-sub" style={{ marginBottom: 14 }}>
                One team for storefronts, centers, HOAs & facilities — concise quote in three quick steps.
            </p>

            {/* Step dots */}
            <div className="step-dots" aria-label="Steps">
                {[1, 2, 3].map(n => (
                    <span key={n} className={`dot ${step === n ? 'on' : ''}`} />
                ))}
            </div>

            {/* Step 1 — services */}
            {step === 1 && (
                <div className="card" style={{ marginTop: 10 }}>
                    <h3 style={{ margin: '0 0 8px' }}>Select services</h3>
                    <div className="addon-chips" role="list" style={{ marginTop: 6 }}>
                        {serviceOptions.map(opt => {
                            const on = selected.includes(opt.id)
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={`chip ${on ? 'on' : ''}`}
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
                        Need something not listed? Add it in notes at the end.
                    </p>

                    <div className="wizard-footer">
                        <button className="cta" type="button" onClick={next}>Next</button>
                        <span className="tiny muted">{note}</span>
                    </div>
                </div>
            )}

            {/* Step 2 — site details */}
            {step === 2 && (
                <div className="card scheduler" style={{ marginTop: 10 }}>
                    <h3 style={{ marginTop: 0 }}>Site details</h3>
                    <form onSubmit={(e) => { e.preventDefault(); next() }}>
                        <div className="full">
                            <label htmlFor="business">Business / Organization</label>
                            <input id="business" name="business" value={form.business} onChange={onChange} required />
                        </div>

                        <div className="full">
                            <label htmlFor="address">Service Address</label>
                            <input id="address" name="address" value={form.address} onChange={onChange} required />
                        </div>
                        <div><label htmlFor="city">City</label>
                            <input id="city" name="city" value={form.city} onChange={onChange} />
                        </div>
                        <div><label htmlFor="state">State</label>
                            <input id="state" name="state" value={form.state} onChange={onChange} />
                        </div>
                        <div><label htmlFor="zip">ZIP</label>
                            <input id="zip" name="zip" value={form.zip} onChange={onChange} />
                        </div>

                        <div><label htmlFor="footage">Approx. Sq Ft</label>
                            <input id="footage" name="footage" inputMode="numeric" placeholder="e.g., 12,000" value={form.footage} onChange={onChange} />
                        </div>
                        <div><label htmlFor="frequency">Frequency</label>
                            <select id="frequency" name="frequency" value={form.frequency} onChange={onChange}>
                                <option value="one-time">One-time</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="semi-annual">Semi-annual</option>
                                <option value="annual">Annual</option>
                            </select>
                        </div>
                        <div className="full"><label htmlFor="access">Access Window</label>
                            <select id="access" name="access" value={form.access} onChange={onChange}>
                                <option value="business-hours">Business hours</option>
                                <option value="after-hours">After hours</option>
                                <option value="flexible">Flexible</option>
                            </select>
                        </div>

                        <div className="wizard-footer">
                            <button className="mini-btn" type="button" onClick={back}>Back</button>
                            <button className="cta" type="submit">Next</button>
                            <span className="tiny muted">{note}</span>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 3 — contact & send */}
            {step === 3 && (
                <div className="card scheduler" style={{ marginTop: 10 }}>
                    <h3 style={{ marginTop: 0 }}>Contact & send</h3>
                    <form onSubmit={(e) => { e.preventDefault(); send() }}>
                        <div><label htmlFor="contact">Contact Name</label>
                            <input id="contact" name="contact" value={form.contact} onChange={onChange} required />
                        </div>
                        <div><label htmlFor="phone">Phone</label>
                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                inputMode="numeric"
                                autoComplete="tel"
                                placeholder="xxx-xxx-xxxx"
                                maxLength={12}
                                value={form.phone}
                                onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                                required
                            />
                        </div>
                        <div className="full"><label htmlFor="email">Email</label>
                            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} required />
                        </div>

                        <div className="full"><label htmlFor="notes">Notes</label>
                            <textarea id="notes" name="notes" value={form.notes} onChange={onChange} placeholder="Surfaces, timing, hazards, water, other requests." />
                        </div>

                        <div className="wizard-footer" style={{ gap: 10 }}>
                            <button className="mini-btn" type="button" onClick={back}>Back</button>
                            <button className="cta" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send Quote Request'}</button>
                            {PHONE ? (
                                <a className="mini-btn" href={`tel:${PHONE}`}>Call Now</a>
                            ) : (
                                <button className="mini-btn" type="button" onClick={() => navigate('/contact')}>Call Now</button>
                            )}
                            <span className="tiny muted">{note}</span>
                        </div>
                    </form>
                </div>
            )}
        </section>
    )
}
