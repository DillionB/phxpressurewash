// src/components/ServicesCarousel.jsx
import React, { useMemo } from 'react'
import { services } from '../data/services.js'

export default function ServicesCarousel() {
  // Duplicate the list so the animation can loop seamlessly.
  const loop = useMemo(() => [...services, ...services], [])

  return (
    <section className="services-carousel" aria-label="Featured Services">
      <div className="carousel-viewport">
        <ul className="carousel-track">
          {loop.map((s, i) => (
            <li className="service-card" key={s.title + '-' + i} aria-label={s.title}>
              <div className="service-card-inner">
                <div className="badge">{s.badge}</div>
                <h3>{s.title}</h3>
                <p>{s.copy}</p>

                {/* Placeholder image block if you want a visual; swap later */}
                <div className="service-img" aria-hidden="true">
                  {/* Optional: put an <img/> later. For now a styled block. */}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
