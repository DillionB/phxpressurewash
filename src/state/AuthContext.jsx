import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext({ session: null, ready: false, signOut: async () => {}, hardSignOut: () => {} })
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let sub
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session || null)

      // Nudge refresh
      import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      // Canonical host guard to keep auth storage on one origin
      if (location.hostname === 'phxpressurewash.com') {
        location.replace(`https://www.phxpressurewash.com${location.pathname}${location.search}${location.hash}`)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      let current = session || null

      // Nudge token refresh on first load after an external redirect (Stripe, email link, etc.)
      try {
        if (current) {
          const { data, error } = await supabase.auth.refreshSession()
          if (!error && data?.session) current = data.session
        }
      } catch (e) {
        // ignore; we fall back to whatever we have
        console.warn('refreshSession failed', e?.message || e)
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

  // Robust sign out: try global; if it fails, clear local tokens anyway.
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
