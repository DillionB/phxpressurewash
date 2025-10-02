import React from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function Header(){
  const navigate = useNavigate()
  const location = useLocation()

  const isServicesActive = location.pathname.startsWith('/shop/')

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

              <a
                href="/shop/res"
                onClick={(e) => { e.preventDefault(); navigate('/shop/res') }}
                className={location.pathname.startsWith('/shop/') ? 'active' : undefined}
              >
                Services
              </a>

              {/* NEW: Rewards */}
              <NavLink to="/rewards" className={({isActive}) => isActive ? 'active' : undefined}>
                Rewards
              </NavLink>

              <NavLink to="/reviews" className={({isActive}) => isActive ? 'active' : undefined}>
                Reviews
              </NavLink>

               <NavLink to="/contact" className={({isActive}) => isActive ? 'active' : undefined}>
               Contact
               </NavLink>

              <NavLink to="/account" className={({isActive}) => isActive ? 'active' : undefined}>
                Account
              </NavLink>
            </nav>


        <a className="cta" href="/#contact" onClick={gotoHomeAnchor('contact')}>Get a Free Quote</a>
      </div>
    </header>
  )
}
