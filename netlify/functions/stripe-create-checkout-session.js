const Stripe = require('stripe')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

const LIMITS = { min: 100, max: 5_000_000, maxQty: 50 }

// Helper to normalize base URL (prefer SITE_URL)
function baseUrl() {
  // Prefer your explicit SITE_URL, else Netlify's URL
  const raw = (process.env.SITE_URL || process.env.URL || '').trim()
  // Strip trailing slashes to avoid //?success=1
  return raw.replace(/\/+$/, '')
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  try {
    const { items, customer_email, user_id } = JSON.parse(event.body || '{}')
    if (!Array.isArray(items) || !items.length) {
      return { statusCode: 400, body: 'No items' }
    }

    const line_items = items.map(it => {
      const unit = Math.max(LIMITS.min, Math.min(LIMITS.max, parseInt(it.unit_amount_cents, 10)))
      const qty  = Math.max(1, Math.min(LIMITS.maxQty, parseInt(it.qty || 1, 10)))
      const name = String(it.title || 'Service').slice(0, 100)
      const desc = String(it.detail || '').slice(0, 400)
      return {
        price_data: { currency: 'usd', product_data: { name, description: desc }, unit_amount: unit },
        quantity: qty
      }
    })

    const origin = baseUrl()
    const success_url = `${origin}/?success=1&session_id={CHECKOUT_SESSION_ID}`
    const cancel_url  = `${origin}/?canceled=1`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      customer_email: customer_email || undefined,
      metadata: { user_id: user_id || '' },
      line_items,
      success_url,
      cancel_url
    })

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) }
  } catch (e) {
    console.error(e)
    return { statusCode: 500, body: 'Server error' }
  }
}
