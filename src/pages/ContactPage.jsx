import React, { useEffect, useState } from 'react'
import InlineScheduler from '../components/InlineScheduler.jsx'
import { supabase } from '../lib/supabase'

export default function ContactPage() {
  const [presetAddress, setPresetAddress] = useState('')

  // Try to prefill address from profile if signed in (safe to ignore if not found)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted || !user) return
        // Adjust field names to match your profiles schema
        const { data, error } = await supabase
          .from('profiles')
          .select('address_line1, address_line2, city, state, zip')
          .eq('id', user.id)
          .single()
        if (!error && data) {
          const parts = [
            data.address_line1, data.address_line2,
            data.city, data.state, data.zip
          ].filter(Boolean)
          if (parts.length) setPresetAddress(parts.join(', '))
        }
      } catch (_) {}
    })()
    return () => { mounted = false }
  }, [])

  return (
    <section className="wrap">
      <h2 className="section-title">Request an Appointment</h2>
      <p className="section-sub">
        Pick a date and time that works—inside our 15-mile service radius. We’ll confirm by email or phone.
      </p>

      <InlineScheduler presetAddress={presetAddress} />

      <div className="tiny muted" style={{ marginTop: 12 }}>
        Prefer to call? <a href="tel:+1-480-555-0123">480-555-0123</a> • 
        Or email <a href="mailto:hello@phxpressurewash.com">hello@phxpressurewash.com</a>
      </div>
    </section>
  )
}
