import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { services } from '../data/services.js'

export default function ServicesTicker() {
    const navigate = useNavigate()

    const targetByTitle = {
        'Home Exterior & Stucco': { route: '/shop/res', tab: 'house' },
        'Concrete, & Oil Stain Removal': { route: '/shop/res', tab: 'driveway' },
        'Commercial Flatwork & Facades': { route: '/shop/com' },
        'Boost Output • Gentle Rinse': { route: '/shop/res', tab: 'solar' },
        'CMU, Block & Perimeter Walls': { route: '/shop/res', tab: 'house' },
        'Stain Treatments': { route: '/shop/res', tab: 'driveway' },
    }

    const loop = useMemo(() => [...services, ...services, ...services], [])

    const Card = ({ s, k }) => {
        const tgt = targetByTitle[s.title] || { route: '/shop/res' }
        const onClick = () => {
            if (tgt.tab) navigate(`${tgt.route}?tab=${encodeURIComponent(tgt.tab)}`)
            else navigate(tgt.route)
        }
        return (
            <article
                className="ticker-card as-button"
                key={k}
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
                aria-label={`${s.badge} — ${s.title}`}
            >
                <div className="ticker-card-inner">
                    <div className="badge">{s.badge}</div>
                    <h3>{s.title}</h3>
                    <p className="ti-copy">{s.copy}</p>
                </div>
            </article>
        )
    }

    return (
        <div className="ticker">
            <div className="ticker-viewport">
                <div className="ticker-track">
                    {loop.map((s, i) => <Card s={s} k={`${s.title}-${i}`} />)}
                </div>
            </div>
        </div>
    )
}
