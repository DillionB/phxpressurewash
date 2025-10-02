import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SlideNavigator from '../components/SlideNavigator.jsx'

export default function SiteLayout() {
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
