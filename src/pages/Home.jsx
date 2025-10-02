// src/pages/Home.jsx
import React, { useEffect } from 'react'
import Hero from '../components/Hero.jsx'
import ServicesCarousel from '../components/ServicesCarousel.jsx'

export default function Home() {
  useEffect(() => {
    // lock scroll on Home
    const scroller = document.getElementById('route-scroll')
    scroller?.classList.add('no-scroll')

    // handle hash deep-link
    if (window.location.hash) {
      const id = window.location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }

    return () => {
      scroller?.classList.remove('no-scroll')
    }
  }, [])

  return (
    <section id="home" className="wrap hero-screen">
      <div className="hero-screen-main">
        <Hero />
      </div>
      <div className="hero-screen-carousel">
        <ServicesCarousel />
      </div>
    </section>
  )
}
