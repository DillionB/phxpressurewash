// src/layouts/SiteLayout.jsx
import React, { useLayoutEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SlideNavigator from '../components/SlideNavigator.jsx'
import { Outlet, useLocation } from 'react-router-dom'

export default function SiteLayout() {
  const { pathname } = useLocation()

  // Keep CSS vars in sync with *actual* header/footer heights
  useLayoutEffect(() => {
    const sync = () => {
      const header = document.querySelector('header.topbar')
      const footer = document.querySelector('footer')
      const h = header?.offsetHeight || 72
      const f = footer?.offsetHeight || 240
      document.documentElement.style.setProperty('--header-h', `${h}px`)
      document.documentElement.style.setProperty('--footer-h', `${f}px`)
    }
    sync()

    // React to size changes (fonts load, responsive, etc.)
    const ro = new ResizeObserver(sync)
    const header = document.querySelector('header.topbar')
    const footer = document.querySelector('footer')
    if (header) ro.observe(header)
    if (footer) ro.observe(footer)
    window.addEventListener('load', sync)
    window.addEventListener('resize', sync)

    return () => {
      ro.disconnect()
      window.removeEventListener('load', sync)
      window.removeEventListener('resize', sync)
    }
  }, [pathname])

  return (
    <div className="app-shell">
      <Header />
      {/* wheel/touch -> route transitions */}
      <SlideNavigator />
      <main id="route-scroll">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
