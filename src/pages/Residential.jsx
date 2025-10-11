// src/pages/Residential.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DrivewayGarageBuilder from '../components/DrivewayGarageBuilder'
import HouseExteriorBuilder from '../components/HouseExteriorBuilder'
import RoofCleaningBuilder from '../components/RoofCleaningBuilder'      // keep if you use it elsewhere
import PatioCleaningBuilder from '../components/PatioCleaningBuilder'
import WindowWashingBuilder from '../components/WindowWashingBuilder'
import SolarPanelBuilder from '../components/SolarPanelBuilder'
import { useCart } from '../state/CartContext'

function Placeholder({ title, note }) {
    const { addItem } = useCart()
    const add = () => addItem({ title, detail: note || 'Site-assessed service', subtotal: 0, meta: ['quote'] })
    return (
        <div className="builder card">
            <h3 style={{ marginTop: 0 }}>{title}</h3>
            <p className="small">Pricing varies by size/material. Add to cart for a free assessment & quote.</p>
            <button className="cta" onClick={add}>Add to Cart (Request Quote)</button>
        </div>
    )
}

export default function Residential() {
    const location = useLocation()
    const navigate = useNavigate()

    const tabs = useMemo(() => ([
        ['driveway', 'Driveway / Garage'],
        ['house', 'House Exterior'],
        ['patio', 'Patio Cleaning'],
        ['windows', 'Window Washing'],
        ['solar', 'Solar Panels'],            // NEW
    ]), [])

    const getInitial = () => {
        const param = new URLSearchParams(location.search).get('tab')
        const t = (param || '').toLowerCase()
        const keys = tabs.map(([k]) => k)
        return keys.includes(t) ? t : 'driveway'
    }

    const [active, setActive] = useState(getInitial())

    // keep state in sync if ?tab= changes
    useEffect(() => { setActive(getInitial()) }, [location.search])

    const changeTab = (val) => {
        setActive(val)
        const sp = new URLSearchParams(location.search)
        sp.set('tab', val)
        navigate({ pathname: '/shop/res', search: sp.toString() }, { replace: true })
    }

    return (
        <section className="wrap" id="book">
            <h2 className="section-title">Residential Services</h2>
            <div className="subtabs">
                {tabs.map(([val, label]) => (
                    <button
                        key={val}
                        className={`tab ${active === val ? 'active' : ''}`}
                        onClick={() => changeTab(val)}
                        type="button"
                    >
                        {label}
                    </button>
                ))}
            </div>

            {active === 'driveway' && <DrivewayGarageBuilder />}
            {active === 'house' && <HouseExteriorBuilder />}
            {active === 'patio' && <PatioCleaningBuilder />}
            {active === 'windows' && <WindowWashingBuilder />}
            {active === 'solar' && <SolarPanelBuilder />}
        </section>
    )
}
