// src/components/ServicesTicker.jsx
import React, { useMemo, useRef, useEffect } from 'react'
import { services } from '../data/services.js'

export default function ServicesTicker() {
  // one set per track; two tracks = seamless loop
  const data = useMemo(() => services, [])
  const vRef = useRef(null)
  const aRef = useRef(null)
  const bRef = useRef(null)
  const rafId = useRef(0)

  // animation state
  const st = useRef({
    w: 0,         // width of a single track (in px)
    xA: 0,        // current translateX for track A
    xB: 0,        // current translateX for track B
    speed: 60,    // px/sec — tweak if you want faster/slower
    last: 0
  })

  useEffect(() => {
    const measure = () => {
      const a = aRef.current
      if (!a) return
      // Use scrollWidth so gaps/padding are included
      const w = a.scrollWidth
      st.current.w = w
      st.current.xA = 0
      st.current.xB = w
      // position immediately
      a.style.transform = `translate3d(${st.current.xA}px, -50%, 0)`
      bRef.current.style.transform = `translate3d(${st.current.xB}px, -50%, 0)`
    }

    const onResize = () => {
      cancelAnimationFrame(rafId.current)
      // Let layout settle then re-measure and restart
      requestAnimationFrame(() => {
        measure()
        start()
      })
    }

    const step = (now) => {
      const s = st.current
      if (!s.last) s.last = now
      const dt = (now - s.last) / 1000
      s.last = now

      const dx = -s.speed * dt
      s.xA += dx
      s.xB += dx

      // When a whole track completely clears the left edge, move it to the right
      const w = s.w
      if (s.xA <= -w) s.xA += w
      if (s.xB <= -w) s.xB += w

      // Apply transforms
      if (aRef.current) aRef.current.style.transform = `translate3d(${s.xA}px, -50%, 0)`
      if (bRef.current) bRef.current.style.transform = `translate3d(${s.xB}px, -50%, 0)`

      rafId.current = requestAnimationFrame(step)
    }

    const start = () => {
      st.current.last = 0
      rafId.current = requestAnimationFrame(step)
    }

    measure()
    start()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId.current)
    }
  }, [])

  const Card = ({ s }) => (
    <article className="ticker-card">
      <div className="ticker-card-inner">
        <div className="badge">{s.badge}</div>
        <h3>{s.title}</h3>
        <p className="ti-copy">{s.copy}</p>
      </div>
    </article>
  )

  return (
    <div className="ticker">
      <div className="ticker-viewport">
        {/* Track A */}
        <div className="carousel-track" ref={aRef}>
          {data.map((s, i) => <Card s={s} key={`a-${i}`} />)}
        </div>
        {/* Track B (identical) */}
        <div className="carousel-track" ref={bRef} aria-hidden="true">
          {data.map((s, i) => <Card s={s} key={`b-${i}`} />)}
        </div>
      </div>
    </div>
  )
}
