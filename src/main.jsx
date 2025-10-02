import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import AppLayout from './layout/AppLayout.jsx'

// Pages
import Home from './pages/Home.jsx'
import ShopPage from './pages/ShopPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import RewardsPage from './pages/RewardsPage.jsx'
import NotFound from './pages/NotFound.jsx'

// State
import { CartProvider } from './state/CartContext'

// Global styles
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            {/* Stripe return URLs can just land on Home (banner will show) */}
            <Route path="/success" element={<Home />} />
            <Route path="/canceled" element={<Home />} />
            {/* Back-compat if someone visits /home */}
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </CartProvider>
  </React.StrictMode>
)
