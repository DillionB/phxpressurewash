// netlify/functions/claim-order.js
const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } })

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const auth = event.headers.authorization || event.headers.Authorization || ''
    const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null

    // Who is claiming?
    let userId = null, email = null
    if (jwt) {
      const { data, error } = await supabaseAdmin.auth.getUser(jwt)
      if (!error && data?.user) {
        userId = data.user.id
        email = data.user.email
      }
    }
    if (!userId && !email) return { statusCode: 401, body: 'Unauthorized' }

    const { session_id } = JSON.parse(event.body || '{}')
    if (!session_id) return { statusCode: 400, body: 'Missing session_id' }

    // 1) If webhook already inserted the order, just attach user/email if missing.
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('orders')
      .select('id,user_id,email')
      .eq('stripe_checkout_id', session_id)
      .maybeSingle()

    if (findErr) {
      console.error('[claim-order] findErr', findErr)
      return { statusCode: 500, body: 'DB error' }
    }

    if (existing?.id) {
      if (!existing.user_id || !existing.email) {
        const { error: updErr } = await supabaseAdmin
          .from('orders')
          .update({
            user_id: existing.user_id || userId,
            email:   existing.email   || email
          })
          .eq('id', existing.id)
        if (updErr) {
          console.error('[claim-order] updErr', updErr)
          return { statusCode: 500, body: 'Update error' }
        }
      }
      return resp({ status: 'claimed-existing' })
    }

    // 2) Fallback: if webhook hasn’t landed, we’ll fetch the session + items and insert now.
    const session = await stripe.checkout.sessions.retrieve(session_id)
    const items = await stripe.checkout.sessions.listLineItems(session_id, { limit: 100 })

    const amount_cents = Number.isFinite(session.amount_total) ? session.amount_total : 0
    const currency = (session.currency || 'usd').toLowerCase()
    const payment_intent = session.payment_intent || null
    const status = session.payment_status || 'paid'
    const sessionEmail = session.customer_details?.email || session.customer_email || null

    const { data: ins, error: insErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId || null,
        email: sessionEmail || email || null,
        status,
        amount_cents,
        currency,
        stripe_checkout_id: session.id,
        payment_intent
      })
      .select('id')
      .single()
    if (insErr) {
      console.error('[claim-order] insert order error', insErr)
      return { statusCode: 500, body: 'Insert error' }
    }

    const order_id = ins.id
    const rows = (items.data || []).map(li => {
      const qty = li.quantity || 1
      let unit = 0
      if (li.price && Number.isFinite(li.price.unit_amount)) unit = li.price.unit_amount
      else if (Number.isFinite(li.amount_subtotal) && qty > 0) unit = Math.round(li.amount_subtotal / qty)

      return {
        order_id,
        title: li.description || li.price?.nickname || 'Service',
        detail: li.description || '',
        unit_amount_cents: unit || 0,
        qty
      }
    })
    if (rows.length) {
      const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(rows)
      if (itemsErr) {
        console.error('[claim-order] insert items error', itemsErr)
        return { statusCode: 500, body: 'Items insert error' }
      }
    }

    return resp({ status: 'claimed-inserted' })
  } catch (e) {
    console.error('[claim-order] error', e)
    return { statusCode: 500, body: 'Server error' }
  }
}

function resp(obj) {
  return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) }
}
