// src/components/Header.jsx
import React from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import logo from '../assets/logo.png'

export default function Header(){
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()

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

        <a className="cta" href="/#contact" onClick={gotoHomeAnchor('contact')}>
          Get a Free Quote
        </a>
      </div>
    </header>
  )
}
