// netlify/functions/create-invoice.js
const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false }
})

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    try {
        // 1) Verify caller is an authenticated admin
        const auth = event.headers.authorization || event.headers.Authorization || ''
        const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null
        if (!jwt) return { statusCode: 401, body: 'Unauthorized' }

        const { data: userResp, error: userErr } = await supabase.auth.getUser(jwt)
        if (userErr || !userResp?.user) return { statusCode: 401, body: 'Unauthorized' }
        const user = userResp.user

        const { data: prof } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle()

        // Optional fallback: allow a specific admin email if you like
        const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || 'admin@phxpressurewash.com'
        const isAdmin = !!prof?.is_admin || (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()
        if (!isAdmin) return { statusCode: 403, body: 'Forbidden' }

        // 2) Parse payload
        const body = JSON.parse(event.body || '{}')
        const { customer_email, customer_name, items } = body

        if (!customer_email) return { statusCode: 400, body: 'Missing customer_email' }
        if (!Array.isArray(items) || items.length === 0) {
            return { statusCode: 400, body: 'No items provided' }
        }

        // Normalize/validate items -> [{ title, detail, price_cents, qty }]
        const normalized = items
            .map(it => {
                const qty = Math.max(1, Number(it.qty || 1))
                const cents = Math.max(0, Number(it.price_cents || 0))
                return {
                    title: it.title || 'Service',
                    detail: it.detail || '',
                    unit_amount: cents, // in cents
                    quantity: qty
                }
            })
            .filter(x => Number.isFinite(x.unit_amount) && x.unit_amount > 0 && x.quantity > 0)

        if (normalized.length === 0) {
            return { statusCode: 400, body: 'All items are zero or invalid' }
        }

        // 3) Find or create customer
        let customerId = null
        const search = await stripe.customers.list({ email: customer_email, limit: 1 })
        if (search.data && search.data.length) {
            customerId = search.data[0].id
        } else {
            const c = await stripe.customers.create({
                email: customer_email,
                name: customer_name || undefined
            })
            customerId = c.id
        }

        // 4) Create a draft invoice FIRST (so we can attach items directly to it)
        const invoice = await stripe.invoices.create({
            customer: customerId,
            collection_method: 'send_invoice',
            days_until_due: 7,
            currency: 'usd',
            metadata: {
                created_by: 'admin_invoice',
                admin_user_id: user.id,
                admin_email: user.email || ''
            }
        })

        // 5) Attach invoice items TO THIS INVOICE (critical: pass invoice: invoice.id)
        for (const line of normalized) {
            await stripe.invoiceItems.create({
                customer: customerId,
                invoice: invoice.id,              // <-- ensures the line is on THIS invoice
                currency: 'usd',
                unit_amount: line.unit_amount,    // cents
                quantity: line.quantity,
                description: line.detail ? `${line.title} — ${line.detail}` : line.title
            })
        }

        // 6) Finalize the invoice so totals/lines are locked in
        const finalized = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: true })

        // 7) Persist an 'invoiced' order in your DB
        const total = finalized.amount_due ?? 0
        const { data: orderRow, error: orderErr } = await supabase
            .from('orders')
            .insert({
                user_id: null,                       // unknown until paid; or you can pass a selected customer account
                email: customer_email,
                status: 'invoiced',                  // will flip to 'paid' on webhook invoice.paid
                amount_cents: total,
                currency: 'usd',
                stripe_invoice_id: finalized.id,
                payment_intent: null,
                stripe_checkout_id: null
            })
            .select('id')
            .single()
        if (orderErr) {
            // not fatal to sending the invoice, but good to log
            console.error('[create-invoice] DB insert error:', orderErr)
        }

        // 8) Send the invoice email with Stripe’s link
        await stripe.invoices.sendInvoice(finalized.id)

        // Respond with URLs for your UI
        return json({
            status: 'sent',
            invoice_id: finalized.id,
            invoice_number: finalized.number,
            hosted_invoice_url: finalized.hosted_invoice_url,
            invoice_pdf: finalized.invoice_pdf,
            amount_due_cents: total
        })
    } catch (err) {
        console.error('[create-invoice] error:', err)
        return { statusCode: 500, body: 'Server error' }
    }
}

function json(obj) {
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) }
}
