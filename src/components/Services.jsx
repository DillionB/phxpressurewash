import React from 'react'
import { services } from '../data/services.js'

export default function Services(){
  return (
    <>
      <h2 className="section-title">Professional Services</h2>
      <p className="section-sub">Commercial & residential exterior cleaning backed by pro equipment and safe methods.</p>
      <div className="grid cols-3">
        {services.map(s => (
          <article className="service" key={s.title}>
            <div className="badge">{s.badge}</div>
            <h3>{s.title}</h3>
            <p>{s.copy}</p>
          </article>
        ))}
      </div>
    </>
  )
}
