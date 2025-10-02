// src/components/Hero.jsx
import React, { useEffect, useRef, useState } from 'react'
import { geocodeAddress, distanceMiles } from '../utils/geocode.js'
import InlineScheduler from './InlineScheduler.jsx'
import bg from '../assets/gb.png'

const ORIGIN_ADDRESS = '25297 N 163rd Dr, Surprise, AZ'
const RADIUS_MILES = 15

export default function Hero() {
  const [origin, setOrigin] = useState(null)          // {lat, lng}
  const [addr, setAddr] = useState('')                // user input
  const [status, setStatus] = useState('idle')        // 'idle' | 'loading' | 'ok' | 'out' | 'error'
  const [miles, setMiles] = useState(null)

  // Parallax refs
  const wrapRef = useRef(null)
  const bgRef = useRef(null)
  const reduceMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current

  // Geocode the origin address once
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const o = await geocodeAddress(ORIGIN_ADDRESS)
        if (mounted) setOrigin({ lat: o.lat, lng: o.lng })
      } catch {
        // fallback: rough Surprise, AZ center if geocode fails
        if (mounted) setOrigin({ lat: 33.6292, lng: -112.3679 })
      }
    })()
    return () => { mounted = false }
  }, [])

  // Lightweight parallax (mouse)
  useEffect(() => {
    if (reduceMotion) return
    const wrap = wrapRef.current
    const bgEl = bgRef.current
    if (!wrap || !bgEl) return

    const maxX = 14   // px
    const maxY = 10   // px
    let raf = 0
    let targetX = 0, targetY = 0
    let curX = 0, curY = 0

    const setTransform = () => {
      // ease towards the target for a slightly buttery feel
      curX += (targetX - curX) * 0.12
      curY += (targetY - curY) * 0.12
      bgEl.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0) scale(1.06)`
      raf = requestAnimationFrame(setTransform)
    }

    const onMove = (e) => {
      const rect = wrap.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width - 0.5   // -0.5 .. 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5
      // invert a touch so it feels like “background moving slower than content”
      targetX = -nx * maxX
      targetY = -ny * maxY
    }

    const onLeave = () => {
      targetX = 0
      targetY = 0
    }

    wrap.addEventListener('mousemove', onMove)
    wrap.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(setTransform)

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
      {/* Subtle, low-opacity background layer */}
      <div
        ref={bgRef}
        className="hero-bg"
        style={{ backgroundImage: `url(${bg})` }}
        aria-hidden="true"
      />
      <div className="hero-grid">
        <div>
          <span className="tag" role="note">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2l2.39 4.84L20 8.27l-3.64 3.55L17.48 18 12 15.27 6.52 18l1.12-6.18L4 8.27l5.61-1.43L12 2z" stroke="var(--sun)" />
            </svg>
            Veteran detail • Commercial & Residential
          </span>
          <h1><span className="sun">Phoenix</span> Pressure Washing Company</h1>
          <p>
            Premium exterior cleaning with a rugged Western edge. We restore curb appeal across <b>Phoenix</b>, <b>Surprise</b>, and <b>Peoria</b>—using pro-grade equipment, soft-wash chemistry, and careful detail.
          </p>

          {/* Address checker */}
          <form className="inline-check" onSubmit={checkAddress}>
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

        {/* keeps your emblem card */}
        <div className="card emblem" aria-hidden="true">
          <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#173E3E" />
                <stop offset="1" stopColor="#0E2626" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#g1)" />
            <g fill="none" stroke="var(--teal)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
              <path d="M80 540 C220 380, 360 420, 520 520" />
              <path d="M560 540 c20 -120 20 -220 0 -340 m0 0 c120 40 140 320 0 340" />
              <path d="M140 660 H660" />
            </g>
            <g fill="var(--sun)" opacity="0.9">
              <rect x="120" y="120" width="100" height="12" rx="6" />
              <rect x="240" y="120" width="100" height="12" rx="6" />
              <rect x="360" y="120" width="100" height="12" rx="6" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
