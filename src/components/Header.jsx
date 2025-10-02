import React from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function Header(){
  const navigate = useNavigate()
  const location = useLocation()

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

          {/* Services tab stays active for ANY /services/* route */}
          <NavLink
            to="/services"
            end={false}
            className={({isActive}) => isActive ? 'active' : undefined}
            onClick={(e) => {
              // If you're not already on a /services/* route, send to default sub-tab
              if (!location.pathname.startsWith('/services/')) {
                e.preventDefault()
                navigate('/services/res')
              }
            }}
          >
            Services
          </NavLink>

          <a href="/#services" onClick={gotoHomeAnchor('services')}>Overview</a>
          <a href="/#coverage" onClick={gotoHomeAnchor('coverage')}>Service Areas</a>
          <a href="/#gallery" onClick={gotoHomeAnchor('gallery')}>Gallery</a>
          <a href="/#reviews" onClick={gotoHomeAnchor('reviews')}>Reviews</a>
          <a href="/#contact" onClick={gotoHomeAnchor('contact')}>Contact</a>

          <NavLink to="/account" className={({isActive}) => isActive ? 'active' : undefined}>
            Account
          </NavLink>
        </nav>

        <a className="cta" href="/#contact" onClick={gotoHomeAnchor('contact')}>Get a Free Quote</a>
      </div>
    </header>
  )
}
