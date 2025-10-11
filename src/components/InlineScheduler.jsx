import React, { useMemo, useState, useEffect } from 'react'
import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export default function InlineScheduler({ presetAddress }) {
    const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
    const [form, setForm] = useState({
        name: '', phone: '', email: '',
        date: today, time: '10:00',
        notes: '', address: presetAddress || ''
    })
    const [note, setNote] = useState('')
    const [sending, setSending] = useState(false)

    useEffect(() => {
        if (PUBLIC_KEY) emailjs.init(PUBLIC_KEY)
        // show a quick sanity log in dev (last 4 chars only)
        if (import.meta.env.DEV) {
            const tail = s => (s ? s.slice(-4) : 'NONE')
            console.log('EmailJS env →',
                { service: tail(SERVICE_ID), template: tail(TEMPLATE_ID), pub: tail(PUBLIC_KEY) }
            )
        }
    }, [])
     
    const formatPhone = (val) => {
        const d = (val || "").replace(/\D/g, "").slice(0, 10);
        const p1 = d.slice(0, 3);
        const p2 = d.slice(3, 6);
        const p3 = d.slice(6, 10);
        return [p1, p2, p3].filter(Boolean).join("-");
    };

    const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!form.name || !form.phone || !form.email) {
            setNote('Please fill out name, phone, and email.')
            return
        }
        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
            setNote('Email not configured yet. Add your EmailJS keys in .env and restart.')
            return
        }

        setSending(true); setNote('Sending…')
        try {
            const datePretty = new Date(`${form.date}T00:00:00`).toLocaleDateString([], {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            })
            const timePretty = new Date(`1970-01-01T${form.time}`).toLocaleTimeString([], {
                hour: 'numeric', minute: '2-digit'
            })

            const templateParams = {
                // keep existing working fields
                from_name: form.name,         // used in your subject
                user_email: form.email,        // used in your body
                reply_to: form.email,        // makes “Reply” go to customer

                // use unambiguous names (avoid reserved/short names)
                customer_phone: form.phone,
                service_address: form.address,
                preferred_date: form.date,       // raw "YYYY-MM-DD"
                preferred_time: form.time,       // raw "HH:mm"
                additional_notes: form.notes,

                // pretty versions for the email text
                date_pretty: datePretty,
                time_pretty: timePretty
            }

            // pass PUBLIC_KEY here too (works even if init() ran)
            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
            setNote('✅ Thanks! We received your request — we’ll confirm your appointment shortly.')
        } catch (err) {
            console.error('EmailJS error:', err)
            const msg = err?.text || err?.message || 'Unknown error'
            setNote(`⚠️ Send failed: ${msg}`)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="scheduler">
            <h3 style={{ marginTop: 0 }}>Schedule an Appointment</h3>
            <p className="small" style={{ marginTop: 0 }}>Inside our 15-mile service radius. Pick a day and time that works.</p>
            <form onSubmit={onSubmit}>
                <div><label htmlFor="date">Preferred Date</label>
                    <input id="date" type="date" name="date" value={form.date} onChange={onChange} min={today} required />
                </div>
                <div><label htmlFor="time">Preferred Time</label>
                    <input id="time" type="time" name="time" value={form.time} onChange={onChange} step="900" required />
                </div>
                <div className="full"><label htmlFor="name">Name</label>
                    <input id="name" name="name" value={form.name} onChange={onChange} required />
                </div>
                <div><label htmlFor="phone">Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="xxx-xxx-xxxx"
                        maxLength={12}                 // 12 includes the dashes
                        value={form.phone}
                        onChange={(e) =>
                            setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))
                        }
                    />
                </div>
                <div><label htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" required />
                </div>
                <div className="full"><label htmlFor="address">Service Address</label>
                    <input id="address" name="address" value={form.address} onChange={onChange} />
                </div>
                <div className="full"><label htmlFor="notes">Notes</label>
                    <textarea id="notes" name="notes" value={form.notes} onChange={onChange} placeholder="Surfaces, square footage, gate code, etc."></textarea>
                </div>
                <div className="full">
                    <button className="cta" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Request Appointment'}</button>
                    <span className="small" style={{ marginLeft: 10 }}>{note}</span>
                </div>
            </form>
        </div>
    )
}
