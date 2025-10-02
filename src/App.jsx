import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StripeReturn from './components/StripeReturn.jsx'
import SiteLayout from './layouts/SiteLayout.jsx'

import Home from './pages/Home.jsx'
import ShopPage from './pages/ShopPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import NotFound from './pages/NotFound.jsx'

import { CartProvider } from './state/CartContext'

export default function App() {
  return (
    <CartProvider>
      {/* Shows success/cancel banner after Stripe redirect */}
      <StripeReturn />

      <Routes>
        {/* All routes share the same header/footer */}
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />

          {/* Shop tabs: /shop/res | /shop/com | /shop/ind */}
          <Route path="/shop/:tab" element={<ShopPage />} />

          {/* Account hub with internal tabs (Profile / Orders / Rewards) */}
          <Route path="/account" element={<AccountPage />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}
