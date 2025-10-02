import React from 'react'
import Hero from '../components/Hero.jsx'
import Services from '../components/Services.jsx'
import Coverage from '../components/Coverage.jsx'
import Gallery from '../components/Gallery.jsx'
import Reviews from '../components/Reviews.jsx'
import ContactForm from '../components/ContactForm.jsx'

export default function Home() {

    useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

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
