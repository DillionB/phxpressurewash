// netlify/functions/stripe-webhook.js
const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false }
})

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
    let stripeEvent
    try {
        stripeEvent = stripe.webhooks.constructEvent(event.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        console.error('Webhook signature verification failed', err.message)
        return { statusCode: 400, body: `Webhook Error: ${err.message}` }
    }

    try {
        // === A) Card checkout flow ===
        if (stripeEvent.type === 'checkout.session.completed') {
            const s = stripeEvent.data.object
            const session = await stripe.checkout.sessions.retrieve(s.id)
            const li = await stripe.checkout.sessions.listLineItems(s.id, { limit: 100 })

            const email = session.customer_details?.email || session.customer_email || null
            const user_id = session.metadata && session.metadata.user_id ? session.metadata.user_id : null
            const amount_cents = session.amount_total ?? 0
            const currency = (session.currency || 'usd').toLowerCase()
            const payment_intent = session.payment_intent || null
            const status = session.payment_status || 'paid'

            // Insert order
            const { data: insOrder, error: orderErr } = await supabase
                .from('orders')
                .insert({
                    user_id,
                    email,
                    status,
                    amount_cents,
                    currency,
                    stripe_checkout_id: session.id,
                    payment_intent
                })
                .select('id')
                .single()
            if (orderErr) throw orderErr

            const order_id = insOrder.id

            // Insert order items
            const itemsPayload = (li.data || []).map((row) => {
                const qty = row.quantity || 1
                let unit = 0
                if (row.price && Number.isFinite(row.price.unit_amount)) {
                    unit = row.price.unit_amount
                } else if (Number.isFinite(row.amount_subtotal) && qty > 0) {
                    unit = Math.round(row.amount_subtotal / qty)
                }
                return {
                    order_id,
                    title: row.description || row.price?.nickname || 'Service',
                    detail: row.description || '',
                    unit_amount_cents: unit || 0,
                    qty
                }
            })
            if (itemsPayload.length) {
                const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload)
                if (itemsErr) throw itemsErr
            }

            // Rewards
            await awardPointAndMaybeIssueTier1({ user_id, email, order_id })
        }

        // === B) Invoicing flow (admin-created invoices) ===
        // If you ever want to upsert the "invoiced" order *from* the webhook instead of
        // your create-invoice function, you could do that here on 'invoice.finalized'.
        if (stripeEvent.type === 'invoice.finalized') {
            // no-op; we already insert the 'invoiced' order in create-invoice.js
        }

        if (stripeEvent.type === 'invoice.paid') {
            const inv = stripeEvent.data.object // id, number, amount_paid, customer_email, etc.

            // Mark existing invoiced order as paid
            const { error: updErr } = await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    amount_cents: inv.amount_paid ?? null
                })
                .eq('stripe_invoice_id', inv.id)
            if (updErr) throw updErr

            // (Optional) You could also award points here if invoiced orders count toward rewards.
            // To do that, you'd need to fetch the order's email/user_id and call awardPointAndMaybeIssueTier1.
        }

        return { statusCode: 200, body: 'ok' }
    } catch (err) {
        console.error('Webhook handler failed:', err)
        return { statusCode: 500, body: 'Server error' }
    }
}

// ===== Helper =====
async function awardPointAndMaybeIssueTier1({ user_id, email, order_id }) {
    // 1) write ledger
    const { error: insErr } = await supabase.from('rewards_ledger').insert({
        user_id: user_id || null,
        email: email || null,
        order_id,
        points: 1,
        source: 'order'
    })
    if (insErr) throw insErr

    // 2) count total points
    let filter = ''
    if (user_id && email) filter = `user_id.eq.${user_id},email.eq.${email}`
    else if (user_id) filter = `user_id.eq.${user_id}`
    else if (email) filter = `email.eq.${email}`
    else return

    const countResp = await supabase
        .from('rewards_ledger')
        .select('*', { count: 'exact', head: true })
        .or(filter)
    if (countResp.error) throw countResp.error
    const totalPoints = countResp.count || 0

    // 3) if user hit 3+ and no Tier1 award yet, issue one
    const { data: existing, error: existErr } = await supabase
        .from('rewards_awards')
        .select('id')
        .eq('tier', 1)
        .or(filter)
        .maybeSingle()
    if (existErr) throw existErr

    if (!existing && totalPoints >= 3) {
        let couponId = process.env.STRIPE_TIER1_COUPON_ID
        if (!couponId) {
            const coupon = await stripe.coupons.create({ percent_off: 10, duration: 'once', name: 'Tier1 10% Off' })
            couponId = coupon.id
        }
        const pc = await stripe.promotionCodes.create({
            coupon: couponId,
            max_redemptions: 1,
            metadata: { tier: '1', user_id: user_id || '', email: email || '' }
        })

        const { error: insAwardErr } = await supabase.from('rewards_awards').insert({
            user_id: user_id || null,
            email: email || null,
            tier: 1,
            coupon_id: couponId,
            promotion_code_id: pc.id,
            code: pc.code,
            metadata: {}
        })
        if (insAwardErr) throw insAwardErr
    }
}
