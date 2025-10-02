import React from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import Residential from './Residential'
import Commercial from './Commercial'
import Industrial from './Industrial'
import CartSummary from '../components/CartSummary'

export default function ShopPage(){
  const { tab } = useParams()
  const navigate = useNavigate()
  const current = ['res','com','ind'].includes(tab) ? tab : 'res'

  return (
    <section className="wrap" id="services-shop">
      <h2 className="section-title">Services</h2>
      <p className="section-sub">Choose a category below, add services to cart, then check out or request a quote.</p>

      {/* Sub-tab bar */}
      <div className="subtabs subtabs-lg">
      <NavLink
        to="/services/res"
        className={({ isActive }) => `subtab-btn ${isActive ? 'active' : ''}`}
      >
        <span className="subtab-ico" aria-hidden="true">
          {/* Home icon */}
          <svg viewBox="0 0 24 24">
            <path d="M3 10.5L12 3l9 7.5M5 10v9h5v-5h4v5h5v-9" />
          </svg>
        </span>
        <span className="subtab-label">Residential</span>
      </NavLink>

      <NavLink
        to="/services/com"
        className={({ isActive }) => `subtab-btn ${isActive ? 'active' : ''}`}
      >
        <span className="subtab-ico" aria-hidden="true">
          {/* Storefront / shop icon */}
          <svg viewBox="0 0 24 24">
            <path d="M3 9l2-4h14l2 4M5 9v10h14V9M8 9v10M16 9v10M9 13h6" />
          </svg>
        </span>
        <span className="subtab-label">Commercial</span>
      </NavLink>

      <NavLink
        to="/services/ind"
        className={({ isActive }) => `subtab-btn ${isActive ? 'active' : ''}`}
      >
        <span className="subtab-ico" aria-hidden="true">
          {/* Excavator icon (simple outline) */}
          <svg viewBox="0 0 24 24">
            <path d="M4 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            <path d="M6 18h8l2-4-4-5H9l-2 4M16 14l4 1 2-2-2-3" />
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
