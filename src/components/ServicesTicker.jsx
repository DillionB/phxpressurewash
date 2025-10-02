// src/components/ServicesTicker.jsx
import React, { useMemo } from 'react'
import { services } from '../data/services.js'

export default function ServicesTicker() {
  // Duplicate the list so the marquee loops seamlessly
  const loop = useMemo(() => [...services, ...services], [])

  return (
    <div className="ticker" aria-label="Service highlights">
      <div className="ticker-track">
        {loop.map((s, i) => (
          <article className="ticker-item" key={`${s.title}-${i}`}>
            <div className="ti-badge">{s.badge}</div>
            <div className="ti-title">{s.title}</div>
          </article>
        ))}
      </div>
    </div>
  )
}
