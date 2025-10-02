// src/pages/ShopPage.jsx
import React, { useEffect } from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import Residential from './Residential'
import Commercial from './Commercial'
import Industrial from './Industrial'
import CartSummary from '../components/CartSummary'

const VALID = ['res','com','ind']

export default function ShopPage(){
  const { tab } = useParams()
  const navigate = useNavigate()
  const current = VALID.includes(tab) ? tab : 'res'

  // If someone lands on /services or /services/whatever, normalize it.
  useEffect(() => {
    if (!VALID.includes(tab)) {
      navigate('/services/res', { replace: true })
    }
  }, [tab, navigate])

  return (
    <section className="wrap" id="services-shop">
      <h2 className="section-title">Services</h2>
      <p className="section-sub">
        Choose a category below, add services to cart, then check out or request a quote.
      </p>

      {/* Sub-tab bar */}
      <div className="subtabs subtabs-lg">
        <NavLink
          to="/services/res"
          className={`subtab-btn ${current === 'res' ? 'active' : ''}`}
          aria-current={current === 'res' ? 'page' : undefined}
        >
          <span className="subtab-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5M5 10v9h5v-5h4v5h5v-9" /></svg>
          </span>
          <span className="subtab-label">Residential</span>
        </NavLink>

        <NavLink
          to="/services/com"
          className={`subtab-btn ${current === 'com' ? 'active' : ''}`}
          aria-current={current === 'com' ? 'page' : undefined}
        >
          <span className="subtab-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 9l2-4h14l2 4M5 9v10h14V9M8 9v10M16 9v10M9 13h6" /></svg>
          </span>
          <span className="subtab-label">Commercial</span>
        </NavLink>

        <NavLink
          to="/services/ind"
          className={`subtab-btn ${current === 'ind' ? 'active' : ''}`}
          aria-current={current === 'ind' ? 'page' : undefined}
        >
          <span className="subtab-ico" aria-hidden="true">
            {/* Excavator icon */}
            <svg viewBox="0 0 24 24">
              <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                {/* tracks + rollers */}
                <rect x="3" y="17" width="13.5" height="3" rx="1.5" />
                <circle cx="7" cy="20" r="2" />
                <circle cx="13" cy="20" r="2" />

                {/* upper body / cab */}
                <path d="M6 17v-3.5c0-.9.7-1.5 1.5-1.5H11l1.5 3V17" />
                {/* cab window hint */}
                <path d="M8.2 12.8h2.2" />

                {/* boom (pivot at body) */}
                <path d="M12.5 12.5l3-2.8 3 .9 2 3.9" />
                {/* stick + bucket */}
                <path d="M18.5 10.6l1.8 3.6-1.1 1.1-3-1" />
                <path d="M20.3 14.2l.9 2.3-2 .6" />
              </g>
            </svg>
          </span>
          <span className="subtab-label">Industrial</span>
        </NavLink>

      </div>

      <div className="shop-layout">
        <div className="shop-main">
          {current === 'res' && <Residential />}
          {current === 'com' && <Commercial />}
          {current === 'ind' && <Industrial />}
        </div>
        <div className="shop-side">
          <CartSummary />
        </div>
      </div>
    </section>
  )
}
