import React from 'react'
import Tabs from '../components/Tabs'
import Residential from './Residential'
import Commercial from './Commercial'
import Industrial from './Industrial'
import CartSummary from '../components/CartSummary'

export default function Shop({ activeTab = 'res', onChangeTab = () => { } }) {
    return (
        <section className="wrap" id="services-shop">
            {/* Keep internal tabs for mobile (optional); header is the primary control */}
            <Tabs
                tabs={[
                    { value: 'res', label: 'Residential' },
                    { value: 'com', label: 'Commercial' },
                    { value: 'ind', label: 'Industrial' },
                ]}
                active={activeTab}
                onChange={onChangeTab}
            />
            <div className="shop-layout">
                <div className="shop-main">
                    {activeTab === 'res' && <Residential />}
                    {activeTab === 'com' && <Commercial />}
                    {activeTab === 'ind' && <Industrial />}
                </div>
                <div className="shop-side">
                    <CartSummary />
                </div>
            </div>
        </section>
    )
}
