// src/components/Hero.jsx
import React, { useEffect, useRef, useState } from 'react'
import { geocodeAddress, distanceMiles } from '../utils/geocode.js'
import InlineScheduler from './InlineScheduler.jsx'
import bg from '../assets/bg.png'
import logo from '../assets/logo4.png'

const ORIGIN_ADDRESS = '25297 N 163rd Dr, Surprise, AZ'
const RADIUS_MILES = 15

export default function Hero() {
  const [origin, setOrigin] = useState(null)
  const [addr, setAddr] = useState('')
  const [status, setStatus] = useState('idle')
  const [miles, setMiles] = useState(null)

  // Parallax refs
  const wrapRef = useRef(null)
  const bgRef = useRef(null)
  const reduceMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current

  // Geocode once
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const o = await geocodeAddress(ORIGIN_ADDRESS)
        if (mounted) setOrigin({ lat: o.lat, lng: o.lng })
      } catch {
        if (mounted) setOrigin({ lat: 33.6292, lng: -112.3679 })
      }
    })()
    return () => { mounted = false }
  }, [])

  // Subtle parallax (anchored to top)
  useEffect(() => {
    if (reduceMotion) return
    const wrap = wrapRef.current
    const bgEl = bgRef.current
    if (!wrap || !bgEl) return

    const maxX = 14, maxY = 10
    let raf = 0, targetX = 0, targetY = 0, curX = 0, curY = 0

    const tick = () => {
      curX += (targetX - curX) * 0.12
      curY += (targetY - curY) * 0.12
      bgEl.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0) scale(1.06)`
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e) => {
      const rect = wrap.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width - 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5
      targetX = -nx * maxX
      // keep the TOP of the image always visible (only move down)
      targetY = Math.max(0, -ny * maxY)
    }

    const onLeave = () => { targetX = 0; targetY = 0 }

    wrap.addEventListener('mousemove', onMove)
    wrap.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      wrap.removeEventListener('mousemove', onMove)
      wrap.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [reduceMotion])

  async function checkAddress(e) {
    e.preventDefault()
    if (!addr || !origin) return
    setStatus('loading')
    try {
      const g = await geocodeAddress(addr)
      const d = distanceMiles(origin, { lat: g.lat, lng: g.lng })
      setMiles(d)
      setStatus(d <= RADIUS_MILES ? 'ok' : 'out')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="hero-with-bg" ref={wrapRef}>
      {/* subtle background */}
      <div
        ref={bgRef}
        className="hero-bg"
        style={{ backgroundImage: `url(${bg})` }}
        aria-hidden="true"
      />

      {/* Centered single-column content */}
      <div className="hero-grid hero-centered">
        <div className="hero-center-inner">
          {/* Keep an h1 for SEO, hide visually (image is the “logo heading”) */}
          <h1 className="sr-only">Phoenix Pressure Washing Company</h1>

          {/* Logo image instead of text heading */}
          <img
            src={logo}
            alt="Phoenix Pressure Washing Company"
            className="hero-logo"
            decoding="async"
          />

          <span className="tag" role="note" style={{ marginTop: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2l2.39 4.84L20 8.27l-3.64 3.55L17.48 18 12 15.27 6.52 18l1.12-6.18L4 8.27l5.61-1.43L12 2z" stroke="var(--sun)" />
            </svg>
            Veteran detail • Commercial & Residential
          </span>

          <p className="hero-blurb">
            Premium exterior cleaning with a rugged Western edge. We restore curb appeal across <b>Phoenix</b>, <b>Surprise</b>, and <b>Peoria</b>—using
            pro-grade equipment, soft-wash chemistry, and careful detail.
          </p>

          {/* Address checker */}
          <form className="inline-check inline-center" onSubmit={checkAddress}>
            <input
              type="text"
              placeholder="Enter your service address"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              aria-label="Service address"
              disabled={!origin || status === 'loading'}
            />
            <button className="cta" type="submit" disabled={!origin || status === 'loading'}>
              {status === 'loading' ? 'Checking…' : 'Check Availability'}
            </button>
          </form>

          {/* Result note */}
          <div className="note">
            {status === 'ok' && miles !== null && (
              <span>✅ Within {RADIUS_MILES} miles ({miles.toFixed(1)} mi). You can schedule below.</span>
            )}
            {status === 'out' && miles !== null && (
              <span>❌ {miles.toFixed(1)} mi away — outside our {RADIUS_MILES}-mile radius from Surprise. Contact us for a custom quote.</span>
            )}
            {status === 'error' && <span>⚠️ Couldn’t find that address. Please check the spelling.</span>}
            {status === 'idle' && <span>We serve addresses within {RADIUS_MILES} miles of Surprise (N 163rd Dr). Enter yours to check.</span>}
          </div>

          {/* Inline scheduler when in range */}
          {status === 'ok' && <InlineScheduler presetAddress={addr} />}
        </div>
      </div>
    </div>
  )
}
