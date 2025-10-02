import React, { useEffect } from 'react'
import logo from '../assets/logo.png'

export default function Header({ shopTab = 'res', onChangeShopTab }) {
    useEffect(() => {
        const onClick = (e) => {
            const a = e.target.closest("a[href^='#']")
            if (!a) return
            const id = a.getAttribute('href').slice(1)
            if (!id) return
            const el = document.getElementById(id)
            if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
        }
        document.addEventListener('click', onClick)
        return () => document.removeEventListener('click', onClick)
    }, [])

    // switch shop tab and let smooth-scroll handle the jump
    const setShop = (val) => onChangeShopTab && onChangeShopTab(val)

    return (
        <header className="topbar">
            <div className="wrap nav">
                <a className="brand" href="#home" aria-label="Phoenix Pressure Washing Company home">
                    <img className="logo-img" src={logo} alt="Phoenix Pressure Washing Company logo" />
                    <span className="brand-title">
                        <b>PHOENIX</b>
                        <span className="brand-sub">Pressure Washing Co.</span>
                    </span>
                </a>

                {/* Main header "tabs" */}
                <nav className="navlinks" aria-label="Primary">
                    {/* Shop categories as first-class tabs */}
                    <a
                        href="#services-shop"
                        aria-current={shopTab === 'res' ? 'page' : undefined}
                        onClick={() => setShop('res')}
                    >
                        Residential
                    </a>
                    <a
                        href="#services-shop"
                        aria-current={shopTab === 'com' ? 'page' : undefined}
                        onClick={() => setShop('com')}
                    >
                        Commercial
                    </a>
                    <a
                        href="#services-shop"
                        aria-current={shopTab === 'ind' ? 'page' : undefined}
                        onClick={() => setShop('ind')}
                    >
                        Industrial
                    </a>

                    {/* Other site sections */}
                    <a href="#coverage">Service Areas</a>
                    <a href="#gallery">Gallery</a>
                    <a href="#reviews">Reviews</a>
                    <a href="#contact">Contact</a>
                    {/* My Orders anchor (shows list for signed-in users) */}
                    <a href="#orders">My Orders</a>
                    <a href="#rewards">Rewards</a>
                </nav>

                <a className="cta" href="#contact">Get a Free Quote</a>
            </div>
        </header>
    )
}
