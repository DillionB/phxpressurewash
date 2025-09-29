import React, { useState } from 'react'
import DrivewayGarageBuilder from '../components/DrivewayGarageBuilder'
import HouseExteriorBuilder from '../components/HouseExteriorBuilder'
import RoofCleaningBuilder from '../components/RoofCleaningBuilder'
import PatioCleaningBuilder from '../components/PatioCleaningBuilder'
import WindowWashingBuilder from '../components/WindowWashingBuilder'     // NEW
import SolarPanelBuilder from '../components/SolarPanelBuilder'           // NEW
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
    const [active, setActive] = useState('driveway')

    return (
        <section className="wrap" id="book">
            <h2 className="section-title">Residential Services</h2>
            <div className="subtabs">
                {[
                    ['driveway', 'Driveway / Garage'],
                    ['house', 'House Exterior'],
                    ['roof', 'Roof Cleaning'],
                    ['patio', 'Patio Cleaning'],
                    ['windows', 'Window Washing'],
                    ['solar', 'Solar Panel Washing'],
                ].map(([val, label]) => (
                    <button key={val} className={`tab ${active === val ? 'active' : ''}`} onClick={() => setActive(val)}>
                        {label}
                    </button>
                ))}
            </div>

            {active === 'driveway' && <DrivewayGarageBuilder />}
            {active === 'house' && <HouseExteriorBuilder />}
            {active === 'roof' && <RoofCleaningBuilder />}
            {active === 'patio' && <PatioCleaningBuilder />}
            {active === 'windows' && <WindowWashingBuilder />}   {/* NEW */}
            {active === 'solar' && <SolarPanelBuilder />}      {/* NEW */}
        </section>
    )
}
