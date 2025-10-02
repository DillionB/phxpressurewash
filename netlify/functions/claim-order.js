const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } })

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const auth = event.headers.authorization || event.headers.Authorization || ''
    const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null

    let userId = null, emailFromJwt = null
    if (jwt) {
      const { data, error } = await supabaseAdmin.auth.getUser(jwt)
      if (!error && data?.user) {
        userId = data.user.id
        emailFromJwt = data.user.email
      }
    }
    if (!userId && !emailFromJwt) return { statusCode: 401, body: 'Unauthorized' }

    const { session_id } = JSON.parse(event.body || '{}')
    if (!session_id) return { statusCode: 400, body: 'Missing session_id' }

    // If webhook already inserted, attach identity if needed
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('orders')
      .select('id,user_id,email')
      .eq('stripe_checkout_id', session_id)
      .maybeSingle()
    if (findErr) return { statusCode: 500, body: 'DB error' }

    if (existing?.id) {
      const order_id = existing.id
      if (!existing.user_id || !existing.email) {
        const { error: updErr } = await supabaseAdmin
          .from('orders')
          .update({
            user_id: existing.user_id || userId,
            email: existing.email || emailFromJwt
          })
          .eq('id', order_id)
        if (updErr) return { statusCode: 500, body: 'Update error' }
      }

      // Award point anyway (noop if already awarded is fine, we base on count)
      await awardPointAndMaybeIssueTier1({ user_id: userId, email: existing.email || emailFromJwt, order_id })
      return json({ status: 'claimed-existing' })
    }

    // Fallback: create order now
    const session = await stripe.checkout.sessions.retrieve(session_id)
    const items = await stripe.checkout.sessions.listLineItems(session_id, { limit: 100 })

    const amount_cents = Number.isFinite(session.amount_total) ? session.amount_total : 0
    const currency = (session.currency || 'usd').toLowerCase()
    const payment_intent = session.payment_intent || null
    const status = session.payment_status || 'paid'
    const email = session.customer_details?.email || session.customer_email || emailFromJwt

    const { data: ins, error: insErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId || null,
        email: email || null,
        status,
        amount_cents,
        currency,
        stripe_checkout_id: session.id,
        payment_intent
      })
      .select('id')
      .single()
    if (insErr) return { statusCode: 500, body: 'Insert error' }

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
      if (itemsErr) return { statusCode: 500, body: 'Items insert error' }
    }

    // Award point and maybe issue Tier 1
    await awardPointAndMaybeIssueTier1({ user_id: userId, email, order_id })

    return json({ status: 'claimed-inserted' })
  } catch (e) {
    console.error('[claim-order] error', e)
    return { statusCode: 500, body: 'Server error' }
  }
}

function json(obj) {
  return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) }
}

// same logic as in webhook
async function awardPointAndMaybeIssueTier1({ user_id, email, order_id }) {
  const { error: insErr } = await supabaseAdmin.from('rewards_ledger').insert({
    user_id: user_id || null,
    email: email || null,
    order_id,
    points: 1,
    source: 'order'
  })
  if (insErr) throw insErr

  let filter = ''
  if (user_id && email) filter = `user_id.eq.${user_id},email.eq.${email}`
  else if (user_id) filter = `user_id.eq.${user_id}`
  else if (email) filter = `email.eq.${email}`
  else return

  const countResp = await supabaseAdmin
    .from('rewards_ledger')
    .select('*', { count: 'exact', head: true })
    .or(filter)
  if (countResp.error) throw countResp.error
  const totalPoints = countResp.count || 0

  const { data: existing, error: existErr } = await supabaseAdmin
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
    const { error: insAwardErr } = await supabaseAdmin.from('rewards_awards').insert({
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
