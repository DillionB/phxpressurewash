// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import StripeReturn from './components/StripeReturn.jsx'
import SiteLayout from './layouts/SiteLayout.jsx'

import Home from './pages/Home.jsx'
import ShopPage from './pages/ShopPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import NotFound from './pages/NotFound.jsx'
import RewardsPage from './pages/RewardsPage.jsx'
import ReviewsPage from './pages/ReviewsPage.jsx'
import ContactPage from './pages/ContactPage.jsx'

import { CartProvider } from './state/CartContext'

export default function App() {
  return (
    <CartProvider>
      {/* Shows success/cancel banner after Stripe redirect */}
      <StripeReturn />

      <Routes>
        {/* All routes share the same header/footer */}
        <Route element={<SiteLayout />}>
          {/* / */}
          <Route index element={<Home />} />

          {/* /shop -> redirect to default tab */}
          <Route path="/shop" element={<Navigate to="/shop/res" replace />} />
          {/* /shop/:tab where :tab is res | com | ind */}
          <Route path="/shop/:tab" element={<ShopPage />} />

          <Route path="/rewards" element={<RewardsPage />} />

          <Route path="/reviews" element={<ReviewsPage />} /> 

          <Route path="/contact" element={<ContactPage />} /> 

          {/* Account hub */}
          <Route path="/account" element={<AccountPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}
