// src/components/ServicesTicker.jsx
import React, { useMemo } from 'react'
import { services } from '../data/services.js'

export default function ServicesTicker() {
  // 3x for a perfect 1/3-width keyframed loop
  const loop = useMemo(() => [...services, ...services, ...services], [])

  const Card = ({ s, k }) => (
    <article className="ticker-card" key={k}>
      <div className="ticker-card-inner">
        <div className="badge">{s.badge}</div>
        <h3>{s.title}</h3>
        <p className="ti-copy">{s.copy}</p>
      </div>
    </article>
  )

  return (
    <div className="ticker">
      <div className="ticker-viewport">
        <div className="ticker-track">
          {loop.map((s, i) => <Card s={s} k={`${s.title}-${i}`} />)}
        </div>
      </div>
    </div>
  )
}
