// src/components/ServicesTicker.jsx
import React, { useEffect, useRef } from 'react'
import { services } from '../data/services.js'

export default function ServicesTicker() {
  const viewportRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return

    // Build one set of cards
    const makeCard = (s, i) => {
      const el = document.createElement('article')
      el.className = 'ticker-card'
      el.innerHTML = `
        <div class="ticker-card-inner">
          <div class="badge">${s.badge}</div>
          <h3>${s.title}</h3>
          <div class="ti-copy">${s.copy}</div>
        </div>`
      el.setAttribute('data-key', `${s.title}-${i}`)
      return el
    }

    track.innerHTML = ''
    const frag = document.createDocumentFragment()
    services.forEach((s, i) => frag.appendChild(makeCard(s, i)))
    track.appendChild(frag)

    // Duplicate until we have enough width to loop seamlessly
    const ensureFill = () => {
      const vw = viewport.clientWidth || 1
      let loops = 0
      while (track.scrollWidth < vw * 2.5 && loops < 20) {
        services.forEach((s, i) => track.appendChild(makeCard(s, `dup${loops}-${i}`)))
        loops++
      }
    }
    ensureFill()

    // Continuous RAF marquee (wrap by moving first child to the end)
    let rafId, last = performance.now(), offset = 0, paused = false
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const speed = 40 // px/sec — tweak if you like

    const gapPx = () => {
      const cs = getComputedStyle(track)
      // rollup/vite sometimes exposes only `gap`
      return parseFloat(cs.columnGap || cs.gap || '0') || 0
    }

    const tick = (now) => {
      const dt = (now - last) / 1000
      last = now
      if (!paused && !prefersReduced) {
        offset -= speed * dt

        // when the first card is fully off-screen, append it to the end and correct offset
        let first = track.firstElementChild
        let gp = gapPx()
        while (first) {
          const w = first.getBoundingClientRect().width + gp
          if (-offset >= w) {
            offset += w
            track.appendChild(first)
            first = track.firstElementChild
          } else {
            break
          }
        }

        track.style.transform = `translateX(${offset}px)`
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    // Pause on hover
    const enter = () => { paused = true }
    const leave = () => { paused = false }
    viewport.addEventListener('mouseenter', enter)
    viewport.addEventListener('mouseleave', leave)

    // Recompute on resize
    const onResize = () => {
      offset = 0
      track.style.transform = 'translateX(0)'
      ensureFill()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(viewport)

    return () => {
      cancelAnimationFrame(rafId)
      viewport.removeEventListener('mouseenter', enter)
      viewport.removeEventListener('mouseleave', leave)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="ticker" aria-label="Service highlights">
      <div className="ticker-viewport" ref={viewportRef}>
        <div className="ticker-track" ref={trackRef} />
      </div>
    </div>
  )
}
