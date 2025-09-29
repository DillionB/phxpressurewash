const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

// Netlify gives us raw body as a string; pass it directly to constructEvent
exports.handler = async (event) => {
    const sig = event.headers['stripe-signature']
    let evt
    try {
        evt = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        return { statusCode: 400, body: `Webhook Error: ${err.message}` }
    }

    if (evt.type === 'checkout.session.completed') {
        const session = evt.data.object
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)

        const amount_cents = session.amount_total || 0
        const user_id = session.metadata?.user_id || null

        // 1) Insert order
        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                user_id,
                stripe_checkout_id: session.id,
                payment_intent: session.payment_intent,
                amount_cents,
                status: 'paid'
            })
            .select('id')
            .single()

        // 2) Itemize from Stripe line items (optional, nice to have)
        if (!error && order) {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })
            const rows = (lineItems.data || []).map(it => ({
                order_id: order.id,
                title: it.description || 'Service',
                detail: it.price?.product || '',
                unit_amount_cents: Math.round(it.amount_subtotal / it.quantity),
                qty: it.quantity
            }))
            if (rows.length) await supabase.from('order_items').insert(rows)
        }
    }

    return { statusCode: 200, body: 'ok' }
}
