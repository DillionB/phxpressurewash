// src/components/CartSummary.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useCart } from '../state/CartContext'
import { supabase } from '../lib/supabase'
import { geocodeAddress, distanceMiles } from '../utils/geocode.js'
import emailjs from '@emailjs/browser'

const ORIGIN_ADDRESS = '25297 N 163rd Dr, Surprise, AZ'
const RADIUS_MILES = 15

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID_FALLBACK = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const TEMPLATE_ID_CART = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CART
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export default function CartSummary() {
    const { items, subtotal, removeItem } = useCart()

    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)

    // UI flow
    const [showAddr, setShowAddr] = useState(false)
    const [outOfRange, setOutOfRange] = useState(false)
    const [miles, setMiles] = useState(null)
    const [addr, setAddr] = useState({
        name: '', email: '', phone: '',
        address: '', city: '', state: '', zip: '',
    })

    useEffect(() => { if (PUBLIC_KEY) emailjs.init(PUBLIC_KEY) }, [])

    const fmtUSD = (n) => (Number(n || 0)).toLocaleString(undefined, { style: 'currency', currency: 'USD' })

    const normalized = useMemo(() => (items || []).map(l => {
        const qty = Math.max(1, Number(l.qty || 1))
        const total = Number(l.subtotal || 0)
        const unit = total / qty
        return { title: l.title || 'Service', detail: l.detail || '', price_cents: Math.round(unit * 100), qty }
    }), [items])

    const billable = useMemo(
        () => normalized.filter(x => Number.isFinite(x.price_cents) && x.price_cents > 0 && x.qty > 0),
        [normalized]
    )

    const addressString = (o = addr) => [o.address, o.city, o.state, o.zip].filter(Boolean).join(', ')
    const onAddrChange = (e) => setAddr(a => ({ ...a, [e.target.name]: e.target.value }))

    const tryPrefillFromProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.id) return false
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, phone, address, city, state, zip')
                .eq('id', user.id).single()
            if (error) return false
            setAddr(a => ({
                ...a,
                name: a.name || data?.full_name || '',
                phone: a.phone || data?.phone || '',
                email: a.email || user.email || '',
                address: a.address || data?.address || '',
                city: a.city || data?.city || '',
                state: a.state || data?.state || '',
                zip: a.zip || data?.zip || '',
            }))
            return true
        } catch { return false }
    }

    const geocodeOrigin = async () => {
        try {
            const o = await geocodeAddress(ORIGIN_ADDRESS)
            return { lat: o.lat, lng: o.lng }
        } catch {
            return { lat: 33.6292, lng: -112.3679 } // fallback
        }
    }

    // Primary button handler (no auto-continue)
    const onPrimary = async () => {
        setNote('')

        if (!items?.length) return setNote('Your cart is empty.')
        if (!billable.length) return setNote('All items are $0 — add a priced service first.')

        if (showAddr) {
            if (outOfRange) return sendOutOfAreaEmail()
            return validateRadiusAndContinue()
        }

        const prefilled = await tryPrefillFromProfile()
        const haveAddr =
            !!addressString().trim() &&
            (!!addr.name || prefilled) &&
            (!!addr.email || prefilled)

        if (!haveAddr) {
            setShowAddr(true)
            setOutOfRange(false)
            setNote('Enter your service address to continue.')
            return
        }

        await validateRadiusAndContinue()
    }

    const validateRadiusAndContinue = async () => {
        setBusy(true); setNote('Checking service area…')
        try {
            const origin = await geocodeOrigin()
            const g = await geocodeAddress(addressString())
            const d = distanceMiles(origin, { lat: g.lat, lng: g.lng })
            setMiles(d)

            if (d <= RADIUS_MILES) {
                await launchStripeCheckout()
            } else {
                setOutOfRange(true)
                setNote(`You're ~${d.toFixed(1)} miles away — outside our ${RADIUS_MILES}-mile radius. You can send a quick quote request instead.`)
            }
        } catch (e) {
            console.error('Geocode error:', e)
            setNote('Could not verify your address. Please check it.')
        } finally {
            setBusy(false)
        }
    }

    const launchStripeCheckout = async () => {
        setNote('Starting checkout…')
        try {
            let accessToken = null
            try {
                const { data } = await supabase.auth.getSession()
                accessToken = data?.session?.access_token || null
            } catch { }

            const resp = await fetch('/.netlify/functions/stripe-create-checkout-session', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
                },
                body: JSON.stringify({ items: billable })
            })

            if (!resp.ok) {
                const t = await resp.text()
                console.error('Checkout start failed:', resp.status, t)
                setNote('Could not start checkout. Please try again.')
                return
            }
            const { url } = await resp.json()
            if (!url) return setNote('No checkout URL returned.')
            window.location = url
        } catch (e) {
            console.error('Checkout error:', e)
            setNote('Network error starting checkout.')
        }
    }

    const sendOutOfAreaEmail = async () => {
        const templateToUse = TEMPLATE_ID_CART || TEMPLATE_ID_FALLBACK
        if (!SERVICE_ID || !templateToUse || !PUBLIC_KEY) {
            setNote('Email not configured. Add EmailJS keys/template to env.')
            return
        }
        if (!addr.name || !addr.phone || !addr.email || !addressString()) {
            setNote('Please complete name, phone, email, and address.')
            return
        }

        setBusy(true); setNote('Sending quote request…')
        try {
            const cartLines = (items || []).map(l => {
                const qty = Math.max(1, Number(l.qty || 1))
                const lineTotal = Number(l.subtotal || 0)
                return `${l.title}${qty > 1 ? ` ×${qty}` : ''} — ${fmtUSD(lineTotal)}${l.detail ? ` (${l.detail})` : ''}`
            }).join('\n')

            const params = {
                from_name: addr.name,
                reply_to: addr.email,
                user_email: addr.email,
                customer_phone: addr.phone,
                service_address: addressString(),
                address_line: addr.address,
                address_city: addr.city,
                address_state: addr.state,
                address_zip: addr.zip,
                cart_summary: cartLines,
                cart_subtotal: fmtUSD(subtotal),
                distance_miles: miles != null ? miles.toFixed(1) : '',
                out_of_area_flag: 'true'
            }

            await emailjs.send(SERVICE_ID, templateToUse, params, PUBLIC_KEY)
            setNote('✅ Thanks! We received your request — we’ll follow up shortly.')
            setOutOfRange(false)
            setShowAddr(false)
        } catch (err) {
            const msg = err?.text || err?.message || 'Unknown error'
            setNote(`⚠️ Send failed: ${msg}`)
        } finally {
            setBusy(false)
        }
    }

    const primaryLabel = (() => {
        if (busy) return 'Working…'
        if (!items?.length) return 'Cart is empty'
        if (!billable.length) return 'Add a priced service'
        if (!showAddr) return 'Proceed to Secure Checkout'
        if (outOfRange) return 'Send Quote Request'
        return 'Check Address & Continue'
    })()

    const primaryDisabled = busy || !items?.length || !billable.length

    // RENDER
    return (
        <aside className="cart card cart-compact" aria-label="Cart">
            <div className="cart-head">
                <h3 className="cart-title">Your Cart</h3>
                <span className="cart-count" aria-label={`${items.length} items in cart`}>{items.length}</span>
            </div>

            {/* Cart view */}
            {!showAddr && (
                <>
                    {items.length === 0 && <p className="small muted" style={{ margin: 0 }}>No items yet.</p>}

                    {items.length > 0 && (
                        <div className="cart-lines" role="list">
                            {items.map((item) => (
                                <div key={item.id || `${item.title}-${Math.random()}`} className="cart-line" role="listitem">
                                    <div className="cart-line-main">
                                        <div className="cart-line-title">{item.title}</div>
                                        {item.detail && <div className="cart-line-sub small">{item.detail}</div>}
                                        {item.meta && item.meta.length > 0 && (
                                            <div className="cart-line-tags">
                                                {item.meta.map((m, i) => <span className="tag-chip" key={`${m}-${i}`}>{m}</span>)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="cart-line-right">
                                        <div className="cart-line-price">{fmtUSD(item.subtotal)}</div>
                                        <button
                                            className="cart-remove"
                                            aria-label={`Remove ${item.title}`}
                                            title="Remove"
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="cart-footer-row" aria-live="polite">
                        <span>Subtotal</span>
                        <b>{fmtUSD(subtotal)}</b>
                    </div>

                    <button className="cta cart-checkout-btn" onClick={onPrimary} disabled={primaryDisabled}>
                        {primaryLabel}
                    </button>
                </>
            )}

            {/* Address/Contact view */}
            {showAddr && (
                <>
                    <div className="cart-footer-row" aria-live="polite" style={{ marginTop: 4 }}>
                        <span>Subtotal</span>
                        <b>{fmtUSD(subtotal)}</b>
                    </div>

                    <div className="cart-inline-form" role="region" aria-label="Service address">
                        <div className="small" style={{ marginBottom: 8 }}>
                            We’ll check if the address is within our {RADIUS_MILES}-mile service radius before payment.
                        </div>

                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div className="full">
                                <label className="tiny">Name</label>
                                <input name="name" value={addr.name} onChange={onAddrChange} />
                            </div>
                            <div>
                                <label className="tiny">Phone</label>
                                <input name="phone" value={addr.phone} onChange={onAddrChange} />
                            </div>
                            <div className="full">
                                <label className="tiny">Email</label>
                                <input name="email" type="email" value={addr.email} onChange={onAddrChange} />
                            </div>
                            <div className="full">
                                <label className="tiny">Address</label>
                                <input name="address" value={addr.address} onChange={onAddrChange} />
                            </div>
                            <div>
                                <label className="tiny">City</label>
                                <input name="city" value={addr.city} onChange={onAddrChange} />
                            </div>
                            <div>
                                <label className="tiny">State</label>
                                <input name="state" value={addr.state} onChange={onAddrChange} />
                            </div>
                            <div>
                                <label className="tiny">ZIP</label>
                                <input name="zip" value={addr.zip} onChange={onAddrChange} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                            <button
                                type="button"
                                className="mini-btn"
                                onClick={() => { setShowAddr(false); setOutOfRange(false); setNote('') }}
                                disabled={busy}
                            >
                                ← Back
                            </button>

                            <button
                                type="button"
                                className="cta"
                                onClick={() => (outOfRange ? sendOutOfAreaEmail() : validateRadiusAndContinue())}
                                disabled={busy}
                            >
                                {busy ? 'Working…' : (outOfRange ? 'Send Quote Request' : 'Check Address & Continue')}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <p className="tiny muted cart-note" style={{ marginTop: 8 }}>
                Totals are estimates. Final pricing confirmed after site assessment.
            </p>

            {note && (
                <p className="small" style={{ marginTop: 6, color: '#ffbda8' }}>
                    {note}
                </p>
            )}
        </aside>
    )
}
