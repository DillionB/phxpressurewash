// netlify/functions/stripe-webhook.js
const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

// Server-side Supabase client with service role (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { persistSession: false } }
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  let stripeEvent

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const s = stripeEvent.data.object

      // Retrieve completed session + line items
      const session = await stripe.checkout.sessions.retrieve(s.id)
      const li = await stripe.checkout.sessions.listLineItems(s.id, { limit: 100 })

      const email =
        session.customer_details?.email ||
        session.customer_email ||
        null

      // We passed user_id when creating the session (if the user was logged in)
      const user_id = (session.metadata && session.metadata.user_id) ? session.metadata.user_id : null

      const amount_cents = session.amount_total ?? 0
      const currency = session.currency || 'usd'
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

      // Prepare items
      const itemsPayload = (li.data || []).map((row) => {
        const qty = row.quantity || 1
        // Stripe returns per-item price as price.unit_amount, but amount_subtotal is total for the line
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
    }

    // (Optional) handle other events like refund, payment_intent.succeeded, etc.

    return { statusCode: 200, body: 'ok' }
  } catch (err) {
    console.error('Webhook handler failed:', err)
    return { statusCode: 500, body: 'Server error' }
  }
}
