// src/pages/Commercial.jsx
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const PHONE = import.meta.env.VITE_BUSINESS_PHONE || '' // optional env var

export default function Commercial() {
    const navigate = useNavigate()

    const services = useMemo(
        () => [
            'Power Washing',
            'Building Washing',
            'Window Washing',
            'Sidewalk Cleaning',
            'Gum Removal',
            'Graffiti Removal',
            'Street Sweeping',
            'Parking Lot Sweeping',
            'Day Porter',
            'Fleet Washing',
            'Roof Cleaning',
            'Parking Garages',
            'Gutter Cleaning',
            'Dumpster Pads',
            'Shopping Carts',
            'Awning Cleaning',
        ],
        []
    )

    const goQuote = () => navigate('/contact?type=commercial&quote=1#scheduler')

    return (
        <section className="wrap">
            <h2 className="section-title">Commercial Services</h2>
            <p className="section-sub">
                Storefronts, centers, HOAs, and facilities — we keep exteriors clean, safe, and on-brand.
            </p>

            <div className="card" style={{ marginBottom: 18 }}>
                <h3 style={{ marginTop: 0 }}>Get all of your exterior cleaning with one team.</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                    A clean property makes a great first impression. We handle sidewalks, drive-thrus, dumpster pads,
                    parking areas, building washes, and more — scheduled around your off-hours.
                </p>

                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    <button className="cta" type="button" onClick={goQuote}>
                        Request a Quote
                    </button>

                    {PHONE ? (
                        <a className="mini-btn" href={`tel:${PHONE}`} aria-label="Call now">
                            Call Now
                        </a>
                    ) : (
                        <button className="mini-btn" type="button" onClick={() => navigate('/contact')}>
                            Call Now
                        </button>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginBottom: 18 }}>
                <h4 style={{ margin: '0 0 10px' }}>What we handle</h4>
                <div className="addon-chips">
                    {services.map((s) => (
                        <span className="chip" key={s} role="listitem">
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            <div className="card">
                <h4 style={{ margin: '0 0 8px' }}>How quotes work</h4>
                <ul className="muted" style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                    <li>We confirm scope (sq ft, surfaces, access windows, water, hazards).</li>
                    <li>You get a written quote and schedule options (after-hours available).</li>
                    <li>Recurring service options for storefronts, centers, and HOAs.</li>
                </ul>
            </div>
        </section>
    )
}
