import React, { useEffect } from 'react'
import Hero from '../components/Hero.jsx'
import Services from '../components/Services.jsx'
import Coverage from '../components/Coverage.jsx'
import Gallery from '../components/Gallery.jsx'
import Reviews from '../components/Reviews.jsx'
import ContactForm from '../components/ContactForm.jsx'

export default function Home() {
  // Smooth-scroll to a hash when landing on "/#section"
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) {
        // wait a frame so layout is ready
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
  }, [])

  return (
    <>
      <main id="home" className="wrap hero">
        <Hero />
      </main>

      <div className="pattern" aria-hidden="true"></div>

      <section id="services" className="wrap">
        <Services />
      </section>

      <section id="coverage" className="wrap coverage">
        <Coverage />
      </section>

      <section id="gallery" className="wrap">
        <Gallery />
      </section>

      <section id="reviews" className="wrap">
        <Reviews />
      </section>

      <section id="contact" className="wrap">
        <ContactForm />
      </section>
    </>
  )
}
