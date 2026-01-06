// src/pages/Home.jsx
import React, { useEffect } from 'react'
import Hero from '../components/Hero.jsx'
import ServicesTicker from '../components/ServicesTicker.jsx'

export default function Home() {
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 960px)').matches
      : false

    if (window.location.hash) {
      const id = window.location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }

    // Desktop-only: keep the “screen” style home experience.
    // Mobile: allow normal scrolling.
    const rs = document.getElementById('route-scroll')
    if (!isMobile) rs?.classList.add('no-scroll')

    return () => {
      if (!isMobile) rs?.classList.remove('no-scroll')
    }
  }, [])

  return (
    // Grid: row 1 (hero) fills leftover space, row 2 is the fixed ticker
    <section id="home" className="hero-screen">
      <div className="hero-screen-main">
        <div className="wrap">
          <Hero />
        </div>
      </div>

      {/* full-bleed ticker */}
      <div className="hero-screen-ticker">
        <ServicesTicker />
      </div>
    </section>
  )
}
