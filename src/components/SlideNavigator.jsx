import React, { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function SlideNavigator() {
  const routeOrder = [
    '/',         // Home
    '/shop/res', // Services sub-tabs
    '/shop/com',
    '/shop/ind',
    '/rewards',
    '/reviews',
    '/contact',
    '/account',  // Next main tab (append '/rewards' later if wanted)
  ]

  const location = useLocation()
  const navigate = useNavigate()
  const ticking = useRef(false)

  const currentIndex = (() => {
    const p = location.pathname
    const i = routeOrder.indexOf(p)
    if (i !== -1) return i
    if (p.startsWith('/shop/')) return routeOrder.indexOf('/shop/res')
    return 0
  })()

  useEffect(() => {
    const throttle = (fn, ms) => (...args) => {
      if (ticking.current) return
      ticking.current = true
      try { fn(...args) } finally { setTimeout(() => { ticking.current = false }, ms) }
    }

    const go = (dir) => {
      const next = currentIndex + dir
      if (next < 0 || next >= routeOrder.length) return
      navigate(routeOrder[next])
    }

    const onWheel = throttle((e) => {
      const tag = (e.target && e.target.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (Math.abs(e.deltaY || 0) < 25) return
      e.preventDefault()
      e.deltaY > 0 ? go(1) : go(-1)
    }, 800)

    let touchY = null
    const onTouchStart = (e) => { touchY = e.touches[0].clientY }
    const onTouchEnd = throttle((e) => {
      if (touchY == null) return
      const dy = (e.changedTouches?.[0]?.clientY ?? touchY) - touchY
      touchY = null
      if (Math.abs(dy) < 40) return
      dy < 0 ? go(1) : go(-1)
    }, 900)

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [currentIndex, navigate])

  return null
}
