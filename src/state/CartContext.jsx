import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

function uid() {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try { return JSON.parse(localStorage.getItem('cart_v1') || '[]') } catch { return [] }
    })

    useEffect(() => {
        localStorage.setItem('cart_v1', JSON.stringify(items))
    }, [items])

    const subtotal = useMemo(
        () => items.reduce((s, i) => s + (i.subtotal || 0), 0),
        [items]
    )

    const addItem = (item) => setItems(prev => [...prev, { ...item, id: uid() }])
    const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id))
    const clearCart = () => setItems([])

    const value = { items, subtotal, addItem, removeItem, clearCart }
    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
