import React, { useState } from 'react'

export default function ContactForm(){
  const [form, setForm] = useState({ name:'', phone:'', email:'', city:'', service:'', message:'' })
  const [note, setNote] = useState('')

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }
  const onSubmit = (e) => {
    e.preventDefault()
    if(!form.name || !form.phone || !form.email){ setNote('Please fill out name, phone, and email.'); return }
    setNote('Thanks! Your request is saved locally — connect this form to email/CRM to receive submissions.')
  }

  return (
    <>
      <h2 className="section-title">Request a Free Quote</h2>
      <p className="section-sub">Tell us a bit about your property and we’ll reply with a same‑week slot.</p>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={form.name} onChange={onChange} autoComplete="name" required />
        </div>
        <div>
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" value={form.phone} onChange={onChange} inputMode="tel" autoComplete="tel" required />
        </div>
        <div className="full">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="city">City</label>
          <select id="city" name="city" value={form.city} onChange={onChange} required>
            <option value="" disabled>Select</option>
            <option>Phoenix</option>
            <option>Surprise</option>
            <option>Peoria</option>
            <option>Glendale</option>
            <option>Sun City</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="service">Service</label>
          <select id="service" name="service" value={form.service} onChange={onChange} required>
            <option value="" disabled>Select</option>
            <option>House Soft Wash</option>
            <option>Driveway / Concrete</option>
            <option>Storefront / Commercial</option>
            <option>Solar Panels</option>
            <option>Walls / Fences</option>
            <option>Rust / Calcium Treatment</option>
          </select>
        </div>
        <div className="full">
          <label htmlFor="message">Project Details</label>
          <textarea id="message" name="message" value={form.message} onChange={onChange} placeholder="Square footage, surfaces, timing…"></textarea>
        </div>
        <div className="full">
          <button className="cta" type="submit">Send Request</button>
          <span className="small" style={{ marginLeft: 10, color: 'var(--muted)' }}>{note}</span>
        </div>
      </form>
    </>
  )
}
