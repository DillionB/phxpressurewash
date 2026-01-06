// src/components/Header.jsx
import React, { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import logo from '../assets/logo.png'

export default function Header(){
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile drawer when the route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Escape closes the drawer
  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  const gotoHomeAnchor = (id) => (e) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate(`/#${id}`)
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
    } else {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const accountLabel = loading ? 'Account' : (user ? 'Account' : 'Sign In')

  return (
    <header className="topbar">
      <div className="wrap nav">
        <Link className="brand" to="/" aria-label="Phoenix Pressure Washing Company home">
          <img className="logo-img" src={logo} alt="Phoenix Pressure Washing Company logo" />
          <span className="brand-title">
            <b>PHOENIX</b>
            <span className="brand-sub">Pressure Washing Co.</span>
          </span>
        </Link>

        <nav className="navlinks" aria-label="Primary">
          <NavLink to="/" end className={({isActive}) => isActive ? 'active' : undefined}>
            Home
          </NavLink>

          {/* Services highlights when on any /shop/* route */}
          <a
            href="/shop/res"
            onClick={(e) => { e.preventDefault(); navigate('/shop/res') }}
            className={location.pathname.startsWith('/shop/') ? 'active' : undefined}
          >
            Services
          </a>

          <NavLink to="/rewards" className={({isActive}) => isActive ? 'active' : undefined}>
            Rewards
          </NavLink>

          <NavLink to="/reviews" className={({isActive}) => isActive ? 'active' : undefined}>
            Reviews
          </NavLink>

          <NavLink to="/contact" className={({isActive}) => isActive ? 'active' : undefined}>
            Contact
          </NavLink>

          {/* Dynamic label: 'Sign In' when not authenticated */}
          <NavLink to="/account" className={({isActive}) => isActive ? 'active' : undefined}>
            {accountLabel}
          </NavLink>
        </nav>

        {/* Mobile hamburger toggle (CSS controls visibility on desktop) */}
        <button
          type="button"
          className="nav-toggle"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen ? 'true' : 'false'}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen(v => !v)}
        >
          <span className="nav-toggle-bars" aria-hidden="true" />
        </button>

        <a className="cta" href="/#contact" onClick={gotoHomeAnchor('contact')}>
          Get a Free Quote
        </a>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="mobile-nav-drawer" id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="mobile-nav-head">
              <span className="mobile-nav-title">Menu</span>
              <button type="button" className="mobile-nav-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">×</button>
            </div>

            <div className="mobile-nav-links" role="navigation" aria-label="Mobile">
              <NavLink to="/" end className={({isActive}) => isActive ? 'active' : undefined}>Home</NavLink>
              <a
                href="/shop/res"
                onClick={(e) => { e.preventDefault(); navigate('/shop/res'); setMobileOpen(false) }}
                className={location.pathname.startsWith('/shop/') ? 'active' : undefined}
              >
                Services
              </a>
              <NavLink to="/rewards" className={({isActive}) => isActive ? 'active' : undefined}>Rewards</NavLink>
              <NavLink to="/reviews" className={({isActive}) => isActive ? 'active' : undefined}>Reviews</NavLink>
              <NavLink to="/contact" className={({isActive}) => isActive ? 'active' : undefined}>Contact</NavLink>
              <NavLink to="/account" className={({isActive}) => isActive ? 'active' : undefined}>{accountLabel}</NavLink>

              <a className="cta mobile-cta" href="/#contact" onClick={(e) => { setMobileOpen(false); gotoHomeAnchor('contact')(e) }}>
                Get a Free Quote
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
