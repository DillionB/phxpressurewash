import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: '60px 0' }}>
      <h2 className="section-title">Page not found</h2>
      <p className="section-sub">The page you’re looking for doesn’t exist.</p>
      <Link className="cta" to="/">Back to Home</Link>
    </div>
  )
}
