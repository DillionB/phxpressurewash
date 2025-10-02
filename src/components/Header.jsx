import React from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function Header(){
  const navigate = useNavigate()
  const location = useLocation()

  // helper to jump to a section on Home (if not on Home, go Home then jump)
  const gotoHomeAnchor = (id) => (e) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate(`/#${id}`)
      // allow the Home page to render, then scroll
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
    } else {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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
          {/* Shop category tabs */}
          <NavLink to="/shop/res" className={({isActive}) => isActive ? 'active' : undefined}>Residential</NavLink>
          <NavLink to="/shop/com" className={({isActive}) => isActive ? 'active' : undefined}>Commercial</NavLink>
          <NavLink to="/shop/ind" className={({isActive}) => isActive ? 'active' : undefined}>Industrial</NavLink>

          {/* Marketing sections on Home */}
          <a href="/#services" onClick={gotoHomeAnchor('services')}>Services</a>
          <a href="/#coverage" onClick={gotoHomeAnchor('coverage')}>Service Areas</a>
          <a href="/#gallery" onClick={gotoHomeAnchor('gallery')}>Gallery</a>
          <a href="/#reviews" onClick={gotoHomeAnchor('reviews')}>Reviews</a>
          <a href="/#contact" onClick={gotoHomeAnchor('contact')}>Contact</a>

          {/* Account */}
          <NavLink to="/account" className={({isActive}) => isActive ? 'active' : undefined}>Account</NavLink>
        </nav>

        <a className="cta" href="/#contact" onClick={gotoHomeAnchor('contact')}>Get a Free Quote</a>
      </div>
    </header>
  )
}
