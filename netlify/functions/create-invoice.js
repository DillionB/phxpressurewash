// phoenix-wash/netlify/functions/create-invoice.js
const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false }
})

/**
 * Body shape:
 * {
 *   recipient: { email: string, name?: string },
 *   items: [{ title, description?, unit_amount_cents, quantity }],
 *   net_terms_days?: number,           // default 7
 *   memo?: string,                     // optional
 *   metadata?: object                  // optional
 * }
 *
 * Requires Authorization: Bearer <supabase access token> and admin user.
 */
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    try {
        // ---- 1) AuthN + AuthZ (admin) ----
        const auth = event.headers.authorization || event.headers.Authorization || ''
        const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null
        if (!jwt) return { statusCode: 401, body: 'Unauthorized' }

        const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt)
        if (userErr || !userData?.user) return { statusCode: 401, body: 'Unauthorized' }
        const userId = userData.user.id
        const userEmail = (userData.user.email || '').toLowerCase()

        // server-side admin check (profiles.is_admin OR ADMIN_EMAIL fallback)
        const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
        let isAdmin = false
        const { data: prof } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', userId).maybeSingle()
        if (prof?.is_admin) isAdmin = true
        if (!isAdmin && adminEmail && userEmail === adminEmail) isAdmin = true
        if (!isAdmin) return { statusCode: 403, body: 'Forbidden' }

        // ---- 2) Parse + validate body ----
        const body = JSON.parse(event.body || '{}')
        const recipient = body.recipient || {}
        if (!recipient.email) return { statusCode: 400, body: 'Missing recipient.email' }

        const items = Array.isArray(body.items) ? body.items : []
        if (items.length === 0) return { statusCode: 400, body: 'No items' }

        const netTerms = Number.isFinite(Number(body.net_terms_days)) ? Number(body.net_terms_days) : 7
        const memo = typeof body.memo === 'string' ? body.memo : ''
        const metadata = (body.metadata && typeof body.metadata === 'object') ? body.metadata : {}

        // ---- 3) Ensure Stripe Customer for recipient ----
        // Prefer search API; fallback to list if not permitted.
        let customer = null
        try {
            const found = await stripe.customers.search({ query: `email:\'${recipient.email}\'` })
            customer = found.data && found.data[0]
        } catch {
            const list = await stripe.customers.list({ email: recipient.email, limit: 1 })
            customer = list.data && list.data[0]
        }
        if (!customer) {
            customer = await stripe.customers.create({
                email: recipient.email,
                name: recipient.name || undefined,
                metadata: { created_via: 'phxpressurewash-admin-invoice' }
            })
        }

        // ---- 4) Create invoice items ----
        for (const it of items) {
            const qty = Math.max(1, Number(it.quantity) || 1)
            const amount = Math.max(0, Number(it.unit_amount_cents) || 0)
            await stripe.invoiceItems.create({
                customer: customer.id,
                currency: 'usd',
                unit_amount: amount,
                quantity: qty,
                description: it.description || it.title || 'Service',
                metadata: { title: it.title || 'Service' }
            })
        }

        // ---- 5) Create invoice (send_invoice method) ----
        const invoice = await stripe.invoices.create({
            customer: customer.id,
            collection_method: 'send_invoice',
            days_until_due: Math.max(0, netTerms),
            auto_advance: false,
            description: memo || undefined,
            metadata
        })

        // finalize + send
        const finalized = await stripe.invoices.finalizeInvoice(invoice.id)
        const sent = await stripe.invoices.sendInvoice(finalized.id)

        // ---- 6) Upsert Supabase order as 'invoiced' + items ----
        // Create a row now; webhook (invoice.paid) will mark it paid later.
        const amountCents = Number.isFinite(sent.amount_due) ? sent.amount_due : null

        const { data: insertedOrder, error: insErr } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: null,                        // owning *customer* is external; this row is about the recipient
                email: recipient.email,
                status: 'invoiced',
                amount_cents: amountCents,
                currency: 'usd',
                stripe_invoice_id: sent.id,
                stripe_invoice_number: sent.number || null,
                metadata: metadata || {}
            })
            .select('id')
            .single()

        if (insErr) {
            // Don't fail the invoice just because DB insert failed—return Stripe link anyway.
            console.warn('[create-invoice] order insert failed:', insErr.message)
        } else {
            // Mirror items -> order_items
            const order_id = insertedOrder.id
            const orderItems = items.map(it => ({
                order_id,
                title: it.title || 'Service',
                detail: it.description || it.title || 'Service',
                unit_amount_cents: Math.max(0, Number(it.unit_amount_cents) || 0),
                qty: Math.max(1, Number(it.quantity) || 1)
            }))
            if (orderItems.length) {
                const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems)
                if (itemsErr) console.warn('[create-invoice] order_items insert failed:', itemsErr.message)
            }
        }

        return json({
            status: 'invoice_sent',
            invoice_id: sent.id,
            hosted_invoice_url: sent.hosted_invoice_url,
            number: sent.number || null
        })
    } catch (e) {
        console.error('[create-invoice] error:', e)
        return { statusCode: 500, body: 'Server error' }
    }
}

function json(obj) {
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) }
}
