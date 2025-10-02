// src/components/ServicesTicker.jsx
import React, { useMemo } from 'react'
import { services } from '../data/services.js'

export default function ServicesTicker() {
  // triple for seamless loop
  const loop = useMemo(() => [...services, ...services, ...services], [])

  return (
    <div className="ticker" aria-label="Service highlights">
      <div className="ticker-viewport">
        <div className="ticker-track">
          {loop.map((s, i) => (
            <article className="ticker-card" key={`${s.title}-${i}`}>
              <div className="ticker-card-inner">
                <div className="badge">{s.badge}</div>
                <h3>{s.title}</h3>
                <div className="ti-copy">{s.copy}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
