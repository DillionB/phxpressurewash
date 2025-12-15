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
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@phxpressurewash.com'

export default function CartSummary() {
    const { items, subtotal, removeItem, clearCart } = useCart()

    // --- shared UI state
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)

    // --- address confirm state (customer flow)
    const [requireAddrConfirm, setRequireAddrConfirm] = useState(false)
    const [showAddr, setShowAddr] = useState(false)
    const [outOfRange, setOutOfRange] = useState(false)
    const [miles, setMiles] = useState(null)
    const [addr, setAddr] = useState({
        name: '', email: '', phone: '',
        address: '', city: '', state: '', zip: '',
    })
    const onAddrChange = (e) => setAddr(a => ({ ...a, [e.target.name]: e.target.value }))
    const addressString = (o = addr) => [o.address, o.city, o.state, o.zip].filter(Boolean).join(', ')

    useEffect(() => { if (PUBLIC_KEY) emailjs.init(PUBLIC_KEY) }, [])

    const fmtUSD = (n) => (Number(n || 0)).toLocaleString(undefined, { style: 'currency', currency: 'USD' })

    // Normalize cart lines to unit prices (cents)
    const normalized = useMemo(() => (items || []).map(l => {
        const qty = Math.max(1, Number(l.qty || 1))
        const total = Number(l.subtotal || 0)
        const unit = total / qty
        return {
            id: l.id,
            title: l.title || 'Service',
            detail: l.detail || '',
            price_cents: Math.round(unit * 100),
            qty
        }
    }), [items])

    const billable = useMemo(
        () => normalized.filter(x => Number.isFinite(x.price_cents) && x.price_cents > 0 && x.qty > 0),
        [normalized]
    )

    // ===== Admin detection (same pattern as Reviews.jsx) =====
    const [session, setSession] = useState(null)
    const [authReady, setAuthReady] = useState(false)
    const [roleReady, setRoleReady] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const signedIn = !!session?.user

    useEffect(() => {
        let unsub
            ; (async () => {
                const { data } = await supabase.auth.getSession()
                setSession(data?.session || null)
                setAuthReady(true)
                await resolveIsAdmin(data?.session || null)
            })()
        const sub = supabase.auth.onAuthStateChange(async (_evt, s) => {
            setSession(s)
            setRoleReady(false)
            setIsAdmin(false)
            await resolveIsAdmin(s)
        })
        unsub = sub?.data?.subscription
        return () => unsub?.unsubscribe?.()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const resolveIsAdmin = async (sess) => {
        try {
            const emailIsAdmin = (sess?.user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()
            if (!sess?.user?.id) { setIsAdmin(false); setRoleReady(true); return }
            const { data } = await supabase.from('profiles').select('is_admin').eq('id', sess.user.id).maybeSingle()
            setIsAdmin(Boolean(data?.is_admin) || emailIsAdmin)
        } catch {
            setIsAdmin(false)
        } finally {
            setRoleReady(true)
        }
    }

    // ===== Prefill profile for address form (customer flow) =====
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

    // =========================
    // CUSTOMER FLOW (Checkout)
    // =========================
    const onPrimaryCustomer = async () => {
        setNote('')
        if (!items?.length) return setNote('Your cart is empty.')
        if (!billable.length) return setNote('All items are $0 — add a priced service first.')

        if (showAddr) {
            if (outOfRange) return sendOutOfAreaEmail()
            return validateRadiusAndContinue()
        }

        if (requireAddrConfirm) {
            setShowAddr(true)
            setOutOfRange(false)
            setNote('Confirm your service address to continue.')
            return
        }

        const prefilled = await tryPrefillFromProfile()
        const haveAddr =
            !!addressString().trim() &&
            (addr.name || prefilled) &&
            (addr.email || prefilled)

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
            } catch { /* ignore */ }

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

    // =========================
    // ADMIN FLOW (Send Invoice)
    // =========================
    const [adminMode, setAdminMode] = useState('invoice') // 'invoice' | 'checkout'
    const [recipient, setRecipient] = useState({ email: '', name: '' })
    const [netTerms, setNetTerms] = useState(7)
    const [memo, setMemo] = useState('')

    // Admin can fine-tune line items before sending
    const [adminLines, setAdminLines] = useState([])
    useEffect(() => {
        setAdminLines(
            billable.map(b => ({
                title: b.title,
                detail: b.detail || '',
                price_cents: b.price_cents, // keep cents here
                qty: b.qty
            }))
        )
    }, [billable])


    const updateLine = (idx, patch) => {
        setAdminLines(lines => lines.map((l, i) => i === idx ? { ...l, ...patch } : l))
    }
    const removeLine = (idx) => setAdminLines(lines => lines.filter((_, i) => i !== idx))

    const sendInvoice = async () => {
        setNote('')
        if (!signedIn || !isAdmin) return setNote('Admin sign-in required.')
        if (!recipient.email) return setNote('Recipient email is required.')
        if (adminLines.length === 0) return setNote('Add at least one line item.')

        const invalid = adminLines.some(l =>
            !Number.isFinite(l.price_cents) || l.price_cents < 0 ||
            !Number.isFinite(l.qty) || l.qty < 1
        )
        if (invalid) return setNote('Check your line items (amounts/qty).')

        let token = null
        try {
            const { data } = await supabase.auth.getSession()
            token = data?.session?.access_token || null
        } catch { }

        setBusy(true)
        try {
            const resp = await fetch('/.netlify/functions/create-invoice', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    ...(token ? { authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    customer_email: recipient.email,
                    customer_name: recipient.name || '',
                    net_terms_days: Number(netTerms) || 7,
                    memo: memo || '',
                    items: adminLines, // [{ title, detail, price_cents, qty }]
                    metadata: { site_order_source: 'phxpressurewash.com' }
                })
            })

            if (!resp.ok) {
                const t = await resp.text()
                console.error('create-invoice failed', t)
                setNote('Could not create/send invoice.')
                return
            }
            const out = await resp.json()
            setNote(`✅ Invoice sent${out.hosted_invoice_url ? ' — link available in Stripe' : ''}.`)
            // optional: clearCart()
        } catch (e) {
            console.error(e)
            setNote('Network error sending invoice.')
        } finally {
            setBusy(false)
        }
    }


    // =========================
    // RENDER
    // =========================
    const primaryCustomerLabel = (() => {
        if (busy) return 'Working…'
        if (!items?.length) return 'Cart is empty'
        if (!billable.length) return 'Add a priced service'
        if (!showAddr) return 'Proceed to Secure Checkout'
        if (outOfRange) return 'Send Quote Request'
        return 'Check Address & Continue'
    })()
    const primaryCustomerDisabled = busy || !items?.length || !billable.length

    return (
        <aside className="cart card cart-compact" aria-label="Cart">
            <div className="cart-head">
                <h3 className="cart-title">Your Cart</h3>
                <span className="cart-count" aria-label={`${items.length} items in cart`}>{items.length}</span>
            </div>

            {/* Lines */}
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

            {/* ===== Admin Switcher ===== */}
            {authReady && roleReady && isAdmin && items.length > 0 && (
                <div className="card" style={{ marginTop: 10, padding: 10 }}>
                    <div className="tiny" style={{ marginBottom: 6, opacity: .8 }}>Admin options</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className={`mini-btn ${adminMode === 'invoice' ? 'selected' : ''}`}
                            onClick={() => setAdminMode('invoice')}
                        >
                            Send Invoice
                        </button>
                        <button
                            type="button"
                            className={`mini-btn ${adminMode === 'checkout' ? 'selected' : ''}`}
                            onClick={() => setAdminMode('checkout')}
                        >
                            Customer Checkout
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Admin Invoice Panel ===== */}
            {authReady && roleReady && isAdmin && adminMode === 'invoice' && items.length > 0 && (
                <div className="card" style={{ marginTop: 12 }}>
                    <h4 style={{ marginTop: 0 }}>Send Payable Invoice</h4>

                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                            <label className="tiny">Recipient email</label>
                            <input
                                value={recipient.email}
                                onChange={(e) => setRecipient(r => ({ ...r, email: e.target.value }))}
                                placeholder="customer@example.com"
                            />
                        </div>
                        <div>
                            <label className="tiny">Recipient name (optional)</label>
                            <input
                                value={recipient.name}
                                onChange={(e) => setRecipient(r => ({ ...r, name: e.target.value }))}
                                placeholder="Acme Stores"
                            />
                        </div>
                        <div>
                            <label className="tiny">Net terms (days)</label>
                            <input
                                type="number"
                                min={0}
                                value={netTerms}
                                onChange={(e) => setNetTerms(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="tiny">Memo (optional)</label>
                            <input
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                placeholder="Pressure wash — scope/memo"
                            />
                        </div>
                    </div>

                    <div className="small" style={{ marginTop: 10, marginBottom: 6 }}>Line items</div>
                    <div className="cart-lines">
                        {adminLines.map((l, i) => (
                            <div key={i} className="cart-line">
                                <div className="cart-line-main" style={{ width: '100%' }}>
                                    <input
                                        className="cart-line-title"
                                        value={l.title}
                                        onChange={(e) => updateLine(i, { title: e.target.value })}
                                        placeholder="Title"
                                    />
                                    <input
                                        className="cart-line-sub"
                                        value={l.detail}
                                        onChange={(e) => updateLine(i, { detail: e.target.value })}
                                        placeholder="Description"
                                    />
                                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
                                        <div>
                                            <label className="tiny">Unit (USD)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={(l.price_cents / 100).toFixed(2)}
                                                onChange={(e) => {
                                                    const v = Math.max(0, Number(e.target.value || 0))
                                                    updateLine(i, { price_cents: Math.round(v * 100) })
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="tiny">Qty</label>
                                            <input
                                                type="number"
                                                min={1}
                                                step="1"
                                                value={l.qty}
                                                onChange={(e) => updateLine(i, { qty: Math.max(1, Number(e.target.value || 1)) })}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                            <button className="mini-btn" type="button" onClick={() => removeLine(i)}>Remove</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        ))}
                        {adminLines.length === 0 && <p className="small muted" style={{ margin: 0 }}>No line items.</p>}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button className="cta" type="button" onClick={sendInvoice} disabled={busy || adminLines.length === 0}>
                            {busy ? 'Sending…' : 'Send Invoice'}
                        </button>
                        <button className="mini-btn" type="button" onClick={clearCart} disabled={busy || items.length === 0}>
                            Clear Cart
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Customer Checkout Panel (default for non-admins) ===== */}
            {(!isAdmin || adminMode === 'checkout') && (
                <>
                    {!showAddr && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                            <button className="cta cart-checkout-btn" onClick={onPrimaryCustomer} disabled={primaryCustomerDisabled}>
                                {primaryCustomerLabel}
                            </button>
                            <button className="mini-btn" onClick={clearCart} disabled={busy || items.length === 0}>
                                Clear
                            </button>
                        </div>
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
                                        onClick={() => {
                                            setShowAddr(false)
                                            setOutOfRange(false)
                                            setNote('')
                                            setRequireAddrConfirm(true)
                                        }}
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
