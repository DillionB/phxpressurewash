// netlify/functions/stripe-create-checkout-session.js
const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

// Use service role so we can verify the passed access token securely
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
})

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const auth = event.headers.authorization || event.headers.Authorization || ''
    const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null

    let userId = null
    let email = null
    if (jwt) {
      // Verify token and get the user
      const { data, error } = await supabaseAdmin.auth.getUser(jwt)
      if (!error && data?.user) {
        userId = data.user.id
        email = data.user.email
      }
    }

    // Cart payload from the client: [{ title, price_cents, qty }, ...]
    const body = JSON.parse(event.body || '{}')
    const items = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) {
      return { statusCode: 400, body: 'No items' }
    }

    const line_items = items.map((it) => ({
      quantity: Math.max(1, Number(it.qty) || 1),
      price_data: {
        currency: 'usd',
        unit_amount: Math.max(0, Number(it.price_cents) || 0),
        product_data: {
          name: it.title || 'Service',
          description: it.detail || undefined,
        },
      },
    }))

    const siteUrl = process.env.SITE_URL || 'https://www.phxpressurewash.com'
    const successUrl = `${siteUrl}/?success=1&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl  = `${siteUrl}/?canceled=1`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email || undefined,       // helps us line up the order if userId is missing
      metadata: userId ? { user_id: userId } : undefined,
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: false },
    })

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    }
  } catch (err) {
    console.error('[stripe-create-checkout-session] error:', err)
    return { statusCode: 500, body: 'Server error' }
  }
}
