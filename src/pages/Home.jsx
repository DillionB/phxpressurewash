import React, { useEffect } from 'react'
import Hero from '../components/Hero.jsx'

export default function Home() {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [])

  return (
    <main id="home" className="wrap hero-screen">
      <Hero />
    </main>
  )
}
