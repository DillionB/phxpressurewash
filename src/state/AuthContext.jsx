import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      // Force canonical host so Supabase session storage stays on one origin
      if (location.hostname === 'phxpressurewash.com') {
        location.replace(`https://www.phxpressurewash.com${location.pathname}${location.search}${location.hash}`)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      let current = session || null

      // Nudge token refresh on first load after external redirects (Stripe/email link)
      if (current) {
        try {
          const { data, error } = await supabase.auth.refreshSession()
          if (!error && data?.session) current = data.session
        } catch (e) {
          console.warn('refreshSession failed', e?.message || e)
        }
      }

      if (mounted) {
        setSession(current)
        setLoading(false)
      }
    })()

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, ses) => {
      setSession(ses || null)
    })

    return () => {
      sub?.subscription?.unsubscribe()
      mounted = false
    }
  }, [])

  // Robust sign out with local fallback
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('signOut global failed, clearing local', e?.message || e)
      await supabase.auth.signOut({ scope: 'local' })
    } finally {
      setSession(null)
      location.reload()
    }
  }

  return (
    <AuthCtx.Provider value={{ session, user: session?.user || null, loading, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
