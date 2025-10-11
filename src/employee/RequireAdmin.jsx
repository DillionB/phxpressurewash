import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Navigate } from 'react-router-dom'

export default function RequireAdmin({ children }) {
    const [loading, setLoading] = useState(true)
    const [allowed, setAllowed] = useState(false)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.user) { if (mounted) setAllowed(false); setLoading(false); return }
                const { data, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .maybeSingle()
                if (!mounted) return
                setAllowed(!!data?.is_admin && !error)
                setLoading(false)
            })()
        return () => { mounted = false }
    }, [])

    if (loading) return <div className="center-wrap"><div className="spinner" /></div>
    if (!allowed) return <Navigate to="/employee/login" replace />
    return children
}
