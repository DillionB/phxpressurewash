// src/components/ServicesTicker.jsx
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { services } from '../data/services.js'

export default function ServicesTicker() {
    const navigate = useNavigate()

    // Map each ticker item to its best destination
    // route: path; tab: residential sub-tab (optional)
    const targetByTitle = {
        'Home Exterior & Stucco': { route: '/services/res', tab: 'house' },
        'Concrete, & Oil Stain Removal': { route: '/services/res', tab: 'driveway' },
        'Commercial Flatwork & Facades': { route: '/services/com' }, // goes to commercial
        'Boost Output • Gentle Rinse': { route: '/services/res', tab: 'solar' },
        'CMU, Block & Perimeter Walls': { route: '/services/res', tab: 'house' },
        'Stain Treatments': { route: '/services/res', tab: 'driveway' },
    }

    // 3x for a perfect 1/3-width keyframed loop
    const loop = useMemo(() => [...services, ...services, ...services], [])

    const Card = ({ s, k }) => {
        const tgt = targetByTitle[s.title] || { route: '/services/res' }
        const onClick = () => {
            if (tgt.tab) {
                // use query param for Residential to pick the tab
                navigate(`${tgt.route}?tab=${encodeURIComponent(tgt.tab)}`)
            } else {
                navigate(tgt.route)
            }
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
