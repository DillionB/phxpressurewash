// src/layouts/SiteLayout.jsx
import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SlideNavigator from '../components/SlideNavigator.jsx'
import { AnimatePresence, motion } from 'framer-motion'

export default function SiteLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen">
      <Header />

      {/* Turn scroll into slide navigation */}
      <SlideNavigator scrollContainerId="route-scroll" />

      {/* Animated route transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          id="route-scroll"
          // Fill viewport between header and footer; adjust if your header/footer heights change
          style={{ minHeight: 'calc(100vh - 68px - 220px)', maxHeight: 'calc(100vh - 68px - 220px)', overflowY: 'auto' }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <Footer />
    </div>
  )
}
