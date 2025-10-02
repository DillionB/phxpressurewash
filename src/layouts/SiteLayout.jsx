// src/layouts/SiteLayout.jsx
import React, { useLayoutEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { Outlet, useLocation } from 'react-router-dom'

export default function SiteLayout() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const syncVars = () => {
      const header = document.querySelector('header.topbar')
      const footer = document.querySelector('footer') // adjust if your Footer uses a different tag
      const h = header?.offsetHeight || 72
      const f = footer?.offsetHeight || 240
      document.documentElement.style.setProperty('--header-h', `${h}px`)
      document.documentElement.style.setProperty('--footer-h', `${f}px`)
    }
    // run now and on resize
    syncVars()
    window.addEventListener('resize', syncVars)
    // run once more after fonts/images
    window.setTimeout(syncVars, 0)
    return () => window.removeEventListener('resize', syncVars)
  }, [pathname])

   return (
    <div className="min-h-screen">
      <Header />
      {/* Intercepts wheel/touch on window and advances routes */}
      <SlideNavigator />
      <main id="route-scroll" style={{ flex: '1 1 auto', overflow: 'hidden' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
