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
      <div className="subtabs">
        <NavLink to="/shop/res" className={({isActive}) => isActive ? 'active' : undefined}>Residential</NavLink>
        <NavLink to="/shop/com" className={({isActive}) => isActive ? 'active' : undefined}>Commercial</NavLink>
        <NavLink to="/shop/ind" className={({isActive}) => isActive ? 'active' : undefined}>Industrial</NavLink>
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
