import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}
