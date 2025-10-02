// src/pages/Home.jsx
import React, { useEffect } from 'react'
import Hero from '../components/Hero.jsx'
import ServicesTicker from '../components/ServicesTicker.jsx'

export default function Home() {
  useEffect(() => {
    // Smooth-scroll to an anchor if landing on /#section
    if (window.location.hash) {
      const id = window.location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }

    // Disable scrolling on the route wrapper for Home only
    const rs = document.getElementById('route-scroll')
    rs?.classList.add('no-scroll')
    return () => rs?.classList.remove('no-scroll')
  }, [])

  return (
    // This container is two rows: (1) hero fills space, (2) ticker row
    <section id="home" className="wrap hero-screen">
      <div className="hero-screen-main" style={{ height: '50%' }}>
        <Hero />
      </div>
      <div className="hero-screen-ticker">
        <ServicesTicker />
      </div>
    </section>
  )
}
