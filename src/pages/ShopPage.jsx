// src/pages/ShopPage.jsx
import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Shop from './Shop'

export default function ShopPage() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const active = ['res', 'com', 'ind'].includes(tab) ? tab : 'res'
  const onChangeTab = (val) => navigate(`/shop/${val}`)
  return (
    <section className="wrap" id="services-shop">
      <Shop activeTab={active} onChangeTab={onChangeTab} />
    </section>
  )
}
