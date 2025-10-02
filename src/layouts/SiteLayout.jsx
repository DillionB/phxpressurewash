// src/layouts/SiteLayout.jsx
import React, { useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SlideNavigator from '../components/SlideNavigator.jsx'

export default function SiteLayout() {
  const { pathname } = useLocation()

  // Keep CSS vars in sync with actual header/footer heights
  useLayoutEffect(() => {
    const syncVars = () => {
      const header = document.querySelector('header.topbar')
      const footer = document.querySelector('footer')
      const h = header?.offsetHeight || 72
      const f = footer?.offsetHeight || 240
      document.documentElement.style.setProperty('--header-h', `${h}px`)
      document.documentElement.style.setProperty('--footer-h', `${f}px`)
    }
    syncVars()
    window.addEventListener('resize', syncVars)
    // run once more after paint (fonts/images)
    const t = setTimeout(syncVars, 0)
    return () => {
      window.removeEventListener('resize', syncVars)
      clearTimeout(t)
    }
  }, [pathname])

  return (
    <div className="min-h-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Restores scroll-to-route behavior (wheel/touch) */}
      <SlideNavigator />

      {/* Hide native scroll so SlideNavigator owns navigation */}
      <main id="route-scroll" style={{ flex: '1 1 auto', overflow: 'hidden' }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
