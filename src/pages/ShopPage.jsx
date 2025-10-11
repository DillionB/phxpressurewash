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
      <p className="section-sub" style={{ textAlign: 'center' }}>
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
              <svg
                className="excavator-ico"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="16" width="12" height="3" rx="1.4"/>
                <circle cx="7" cy="19" r="1.7"/>
                <circle cx="12" cy="19" r="1.7"/>
                <path d="M6 16v-3.2c0-.9.7-1.6 1.6-1.6H11l1.6 3.2V16"/>
                <path d="M8.2 11.3h2.2"/>
                <path d="M12.6 11l3-2.8 3 .9 2 4"/>
                <path d="M18.6 9l1.8 3.7-1.1 1.1-2.9-1"/>
                <path d="M20.4 12.7l.9 2.4-2 .6"/>
              </svg>
            </span>

          <span className="subtab-label">Industrial</span>
        </NavLink>

      </div>

      <div className="shop-layout" style={{ paddingBottom: '50px' }}>
        <div className="shop-main">
          {current === 'res' && <Residential />}
          {current === 'ind' && <Industrial />}
          {current === 'com' && <Commercial />}
        </div>
        <div className="shop-side">
          <CartSummary />
        </div>
      </div>
    </section>
  )
}
