// src/components/ServicesTicker.jsx
import React, { useMemo } from 'react'
import { services } from '../data/services.js'

export default function ServicesTicker() {
  // Duplicate so the marquee can loop seamlessly
  const loop = useMemo(() => [...services, ...services], [])

  return (
    <div className="ticker" aria-label="Service highlights">
      <div className="ticker-viewport">
        <ul className="ticker-track">
          {loop.map((s, i) => (
            <li className="ticker-card" key={`${s.title}-${i}`}>
              <div className="ticker-card-inner">
                <div className="badge">{s.badge}</div>
                <h3>{s.title}</h3>
                <p className="ti-copy">{s.copy}</p>
                {/* Optional image placeholder (swap with <img> later) */}
                <div className="ti-img" aria-hidden="true" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
