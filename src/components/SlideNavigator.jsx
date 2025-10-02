
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SLIDES } from '../config/slides'

export default function SlideNavigator({ scrollContainerId = 'route-scroll' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const busy = useRef(false)
  const touchStartY = useRef(null)

  const index = SLIDES.findIndex(s => s.path === location.pathname)

  const go = (dir) => {
    const next = dir > 0 ? Math.min(index + 1, SLIDES.length - 1) : Math.max(index - 1, 0)
    if (next !== index) {
      busy.current = true
      navigate(SLIDES[next].path)
      setTimeout(() => { busy.current = false }, 600)
    }
  }

  useEffect(() => {
    const canRoute = (deltaY) => {
      if (busy.current) return false
      const scroller = document.getElementById(scrollContainerId)
      if (!scroller) return true 
      const { scrollTop, scrollHeight, clientHeight } = scroller
      const atTop = scrollTop <= 0
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1
      if (deltaY > 0) return atBottom 
      if (deltaY < 0) return atTop    
    }

    const onWheel = (e) => {
      if (!canRoute(e.deltaY)) return
      e.preventDefault()
      go(e.deltaY > 0 ? +1 : -1)
    }

    const onKey = (e) => {
      if (['ArrowDown', 'PageDown'].includes(e.key) && canRoute(1)) { e.preventDefault(); go(+1) }
      if (['ArrowUp', 'PageUp'].includes(e.key) && canRoute(-1)) { e.preventDefault(); go(-1) }
    }

    const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY }
    const onTouchEnd = (e) => {
      if (touchStartY.current == null) return
      const dy = touchStartY.current - e.changedTouches[0].clientY
      if (Math.abs(dy) < 40) return
      if (!canRoute(dy)) return
      go(dy > 0 ? +1 : -1)
      touchStartY.current = null
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [index, navigate, scrollContainerId])

  return null
}
