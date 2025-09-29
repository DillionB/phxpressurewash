import React, { useState } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Services from './components/Services.jsx'
import Coverage from './components/Coverage.jsx'
import Gallery from './components/Gallery.jsx'
import Reviews from './components/Reviews.jsx'
import ContactForm from './components/ContactForm.jsx'
import Footer from './components/Footer.jsx'
import Shop from './pages/Shop'
import { CartProvider } from './state/CartContext'

// NEW: Stripe success/cancel banner and My Orders section
import StripeReturn from './components/StripeReturn.jsx'
import Orders from './components/Orders.jsx'

export default function App() {
    const [shopTab, setShopTab] = useState('res') // 'res' | 'com' | 'ind'

    // When a header tab is clicked, set the tab and scroll to the shop
    const handleChangeShopTab = (val) => {
        setShopTab(val)
        const el = document.getElementById('services-shop')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <CartProvider>
            <div className="min-h-screen">
                {/* Shows a banner when returning from Stripe (?success=1 or ?canceled=1) */}
                <StripeReturn />

                <Header shopTab={shopTab} onChangeShopTab={handleChangeShopTab} />

                <main id="home" className="wrap hero">
                    <Hero />
                </main>

                <div className="pattern" aria-hidden="true"></div>

                {/* Marketing/services overview (static grid) */}
                <section id="services" className="wrap">
                    <Services />
                </section>

                {/* Interactive shop with tabs and cart */}
                <Shop activeTab={shopTab} onChangeTab={setShopTab} />

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

                {/* Signed-in users can see their orders (RLS enforced) */}
                <Orders />

                <Footer />
            </div>
        </CartProvider>
    )
}
