import React, { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * SlideNavigator
 * - Intercepts wheel / swipe on the given scroll container
 * - Advances through routeOrder
 * - Includes nested steps for Services sub-tabs
 */
export default function SlideNavigator({ scrollContainerId = 'route-scroll' }) {
  const routeOrder = [
    '/',           // Home
    '/shop/res',   // Services sub-tab 1
    '/shop/com',   // Services sub-tab 2
    '/shop/ind',   // Services sub-tab 3
    '/account'     // Next main tab (add '/rewards' after this if you like)
  ]

  const location = useLocation()
  const navigate = useNavigate()
  const ticking = useRef(false)

  // Normalize path to one of the known steps
  const currentIndex = (() => {
    const p = location.pathname
    const i = routeOrder.indexOf(p)
    if (i !== -1) return i
    // Map unknown /shop/* to /shop/res index (closest step)
    if (p.startsWith('/shop/')) return routeOrder.indexOf('/shop/res')
    return 0
  })()

  useEffect(() => {
    const el = document.getElementById(scrollContainerId) || window

    const throttle = (fn, ms) => {
      return (...args) => {
        if (ticking.current) return
        ticking.current = true
        try { fn(...args) } finally {
          setTimeout(() => { ticking.current = false }, ms)
        }
      }
    }

    const go = (dir) => {
      const next = currentIndex + dir
      if (next < 0 || next >= routeOrder.length) return
      navigate(routeOrder[next])
    }

    const onWheel = throttle((e) => {
      // If user is scrolling inside a text area or input, let it pass
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : ''
      if (tag === 'textarea' || tag === 'input' || tag === 'select') return

      const dy = e.deltaY || 0
      if (Math.abs(dy) < 25) return
      e.preventDefault()
      if (dy > 0) go(1)
      else go(-1)
    }, 800)

    // Basic touch swipe
    let touchY = null
    const onTouchStart = (e) => { touchY = e.touches[0].clientY }
    const onTouchEnd = throttle((e) => {
      if (touchY == null) return
      const dy = (e.changedTouches?.[0]?.clientY ?? touchY) - touchY
      touchY = null
      if (Math.abs(dy) < 40) return
      if (dy < 0) go(1)
      else go(-1)
    }, 900)

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, navigate, scrollContainerId])

  return null
}
