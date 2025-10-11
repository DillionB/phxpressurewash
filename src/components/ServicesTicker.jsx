import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { services } from '../data/services.js'

export default function ServicesTicker() {
    const navigate = useNavigate()

    // Prefer mapping by BADGE (more reliable than title with special chars)
    const targetsByBadge = {
        '🏠 House Soft Wash': '/shop/res?tab=house',
        '🚘 Driveways & Walkways': '/shop/res?tab=driveway',
        '🏢 Storefronts & HOA': '/shop/com',
        '🌞 Solar Panels': '/shop/res?tab=solar',
        '🧱 Walls & Fences': '/shop/res?tab=house',
        '🌵 Rust & Calcium': '/shop/res?tab=driveway',
    }

    // Optional fallback by title (kept for completeness)
    const targetsByTitle = {
        'Home Exterior & Stucco': '/shop/res?tab=house',
        'Concrete, & Oil Stain Removal': '/shop/res?tab=driveway',
        'Commercial Flatwork & Facades': '/shop/com',
        'Boost Output • Gentle Rinse': '/shop/res?tab=solar',
        'CMU, Block & Perimeter Walls': '/shop/res?tab=house',
        'Stain Treatments': '/shop/res?tab=driveway',
    }

    const loop = useMemo(() => [...services, ...services, ...services], [])

    const Card = ({ s, k }) => {
        const route = targetsByBadge[s.badge] || targetsByTitle[s.title] || '/shop/res?tab=driveway'
        const go = () => navigate(route)

        return (
            <article
                className="ticker-card as-button"
                key={k}
                role="button"
                tabIndex={0}
                onClick={go}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go()}
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
