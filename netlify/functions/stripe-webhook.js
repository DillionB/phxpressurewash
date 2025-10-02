// netlify/functions/stripe-webhook.js
// Node 18+, CommonJS

const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

// Supabase (service role – bypasses RLS for server writes)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { persistSession: false } }
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // Stripe needs the raw request body for signature verification.
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err?.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const obj = stripeEvent.data.object
        // Retrieve full session and its line items
        // (separate call is the most reliable across API versions)
        const session = await stripe.checkout.sessions.retrieve(obj.id)
        const lineItems = await stripe.checkout.sessions.listLineItems(obj.id, { limit: 100 })

        const email =
          session.customer_details?.email ||
          session.customer_email ||
          null

        const user_id = session?.metadata?.user_id || null
        const amount_cents = Number.isFinite(session.amount_total) ? session.amount_total : 0
        const currency = (session.currency || 'usd').toLowerCase()
        const payment_intent = session.payment_intent || null
        const status = session.payment_status || 'paid'
        const stripe_checkout_id = session.id

        // Idempotency: skip if we've already inserted this checkout_id
        {
          const { data: existing, error: existErr } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('stripe_checkout_id', stripe_checkout_id)
            .maybeSingle()

          if (existErr) {
            console.warn('[stripe-webhook] check existing order failed:', existErr.message)
          }
          if (existing?.id) {
            // Already processed
            return { statusCode: 200, body: 'ok (already processed)' }
          }
        }

        // Insert order
        const { data: insertedOrder, error: orderErr } = await supabaseAdmin
          .from('orders')
          .insert({
            user_id,
            email,
            status,
            amount_cents,
            currency,            // <-- make sure you added this column in DB
            payment_intent,
            stripe_checkout_id,
          })
          .select('id')
          .single()

        if (orderErr) throw orderErr
        const order_id = insertedOrder.id

        // Prepare order_items
        const itemsPayload = (lineItems.data || []).map((row) => {
          const qty = row.quantity || 1
          // Try to get unit price; if missing, compute from subtotal/qty
          let unit = 0
          if (row.price && Number.isFinite(row.price.unit_amount)) {
            unit = row.price.unit_amount
          } else if (Number.isFinite(row.amount_subtotal) && qty > 0) {
            unit = Math.round(row.amount_subtotal / qty)
          }

          // Title/detail fallbacks
          const title =
            row.description ||
            row.price?.nickname ||
            row.price?.product ||
            'Service'
          const detail = row.description || ''

          return {
            order_id,
            title,
            detail,
            unit_amount_cents: unit || 0,
            qty,
          }
        })

        if (itemsPayload.length > 0) {
          const { error: itemsErr } = await supabaseAdmin
            .from('order_items')
            .insert(itemsPayload)
          if (itemsErr) throw itemsErr
        }

        break
      }

      // You can add more events here (refunds, failed payments, etc.)
      // case 'payment_intent.succeeded':
      // case 'charge.refunded':
      //   break;

      default:
        // For events you don't explicitly handle, still return 200 so Stripe stops retrying
        break
    }

    return { statusCode: 200, body: 'ok' }
  } catch (err) {
    // Log full error and let Stripe retry if needed
    console.error('[stripe-webhook] handler error:', err)
    return { statusCode: 500, body: 'Server error' }
  }
}
