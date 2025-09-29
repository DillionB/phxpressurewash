import React from 'react'
import logo from '../assets/logo.png'

export default function Footer(){
  const year = new Date().getFullYear()
  return (
    <footer>
      <div className="wrap footgrid">
        <div>
          <div className="brand" style={{ gap: 10 }}>
            <img className="logo-img" src={logo} alt="Phoenix Pressure Washing Company logo" />
            <div className="brand-title"><b>PHOENIX</b><span className="brand-sub">Pressure Washing Co.</span></div>
          </div>
          <p className="small" style={{ marginTop: 10 }}>Serving Phoenix, Surprise, Peoria & the Northwest Valley.</p>
          <p className="small">© {year} Phoenix Pressure Washing Company. All rights reserved.</p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px' }}>Contact</h4>
          <p className="small">Phone: <a href="tel:+16233138176">(623) 313-8176</a><br/>Email: <a href="mailto:info@phoenixwash.co">info@phoenixwash.co</a></p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px' }}>Quick Links</h4>
          <p className="small"><a href="#services">Services</a><br/><a href="#coverage">Service Areas</a><br/><a href="#contact">Free Quote</a></p>
        </div>
      </div>
    </footer>
  )
}
