import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const defaultAuthValue = {
  session: null,
  user: null,
  loading: true,
  // no-op; safe to call even if provider isn't mounted
  signOut: async () => {},
}

const AuthCtx = createContext(defaultAuthValue)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      // Keep Supabase session on a single origin
      if (typeof window !== 'undefined' && location.hostname === 'phxpressurewash.com') {
        location.replace(`https://www.phxpressurewash.com${location.pathname}${location.search}${location.hash}`)
        return
      }

      // Initial session
      const { data: { session: initial } } = await supabase.auth.getSession()
      let current = initial ?? null

      // Nudge a refresh after external redirects (Stripe/email link)
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

    // Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, ses) => {
      setSession(ses ?? null)
    })

    return () => {
      sub?.subscription?.unsubscribe?.()
      mounted = false
    }
  }, [])

  // Robust sign out with local fallback + visual reset
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('signOut global failed, clearing local', e?.message || e)
      await supabase.auth.signOut({ scope: 'local' })
    } finally {
      setSession(null)
      // Hard reload to clear any user-scoped UI state
      if (typeof window !== 'undefined') location.reload()
    }
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
  }

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
