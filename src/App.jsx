// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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

// --- Employee app (admin) ---
import EmployeeLogin from './employee/Login.jsx'
import AdminHome from './employee/AdminHome.jsx'
import RequireAdmin from './employee/RequireAdmin.jsx'

// Lightweight iOS install hint (only shows on iPhone/iPad Safari when not already installed)
function InstallHint() {
    const location = useLocation()
    const [show, setShow] = useState(false)

    const isIOS = useMemo(
        () => /iphone|ipad|ipod/i.test(navigator.userAgent || ''),
        []
    )
    const isStandalone = useMemo(
        () =>
            window.matchMedia?.('(display-mode: standalone)')?.matches ||
            // iOS Safari legacy flag:
            window.navigator.standalone === true,
        []
    )

    useEffect(() => {
        // Only hint on the employee app routes; tweak if you want it site-wide.
        const onEmployeeApp = location.pathname.startsWith('/employee')
        setShow(isIOS && !isStandalone && onEmployeeApp)
    }, [isIOS, isStandalone, location.pathname])

    if (!show) return null

    return (
        <div
            style={{
                position: 'fixed',
                left: 12,
                right: 12,
                bottom: 12,
                zIndex: 2000,
                background: 'rgba(18,18,18,.95)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 12,
                padding: '10px 12px',
                backdropFilter: 'blur(6px)',
                color: 'var(--text, #fff)',
                boxShadow: '0 6px 20px rgba(0,0,0,.35)'
            }}
            role="note"
        >
            <div style={{ fontSize: 14, marginBottom: 6, fontWeight: 600 }}>
                Install “PHX Employee” on your Home Screen
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.35 }}>
                Tap <b>Share</b> → <b>Add to Home Screen</b> for a full-screen app experience.
            </div>
            <button
                type="button"
                onClick={() => setShow(false)}
                className="mini-btn"
                style={{ marginTop: 8 }}
            >
                Got it
            </button>
        </div>
    )
}

// Register the service worker so iOS will treat it as installable
function ServiceWorkerRegistrar() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => { })
            })
        }
    }, [])
    return null
}

export default function App() {
    return (
        <CartProvider>
            {/* PWA bits */}
            <ServiceWorkerRegistrar />
            <InstallHint />

            {/* Shows success/cancel banner after Stripe redirect */}
            <StripeReturn />

            <Routes>
                {/* Public site (header/footer via SiteLayout) */}
                <Route element={<SiteLayout />}>
                    <Route index element={<Home />} />
                    <Route path="/shop" element={<Navigate to="/shop/res" replace />} />
                    <Route path="/shop/:tab" element={<ShopPage />} />
                    <Route path="/rewards" element={<RewardsPage />} />
                    <Route path="/reviews" element={<ReviewsPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="*" element={<NotFound />} />
                </Route>

                {/* Employee app (no public header/footer) */}
                <Route path="/employee/login" element={<EmployeeLogin />} />
                <Route
                    path="/employee/admin"
                    element={
                        <RequireAdmin>
                            <AdminHome />
                        </RequireAdmin>
                    }
                />
            </Routes>
        </CartProvider>
    )
}
