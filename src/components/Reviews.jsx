// src/components/Reviews.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@phxpressurewash.com'

function StarPicker({ value, onChange, disabled }) {
    return (
        <div className="stars" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    className={`star ${n <= value ? 'on' : ''}`}
                    aria-pressed={n === value}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    onClick={() => !disabled && onChange(n)}
                    disabled={disabled}
                >★</button>
            ))}
        </div>
    )
}

export default function Reviews() {
    // Auth / role gates
    const [session, setSession] = useState(null)
    const [authReady, setAuthReady] = useState(false)
    const [roleReady, setRoleReady] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    // Composer
    const [myReview, setMyReview] = useState(null)
    const [rating, setRating] = useState(5)
    const [body, setBody] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [note, setNote] = useState('')

    // Wall
    const [reviews, setReviews] = useState([])
    const [page, setPage] = useState(0)
    const pageSize = 18
    const [hasMore, setHasMore] = useState(true)

    const signedIn = !!session?.user
    const wallTopRef = useRef(null)

    // --- Auth bootstrap (always flip authReady) ---
    useEffect(() => {
        let mounted = true

        const init = async () => {
            try {
                const { data } = await supabase.auth.getSession()
                if (!mounted) return
                setSession(data?.session ?? null)
            } catch {
                // ignore
            } finally {
                if (mounted) setAuthReady(true)
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_evt, s) => {
            setSession(s)
            // pause grid while role flips
            setRoleReady(false)
            setIsAdmin(false)
            setReviews([])     // clear grid immediately to avoid role flicker
            setHasMore(true)
            await resolveIsAdmin(s)
        })

        init()

        return () => {
            mounted = false
            subscription?.unsubscribe?.()
        }
    }, [])

    // --- Resolve admin (profiles.is_admin OR ADMIN_EMAIL) ---
    const resolveIsAdmin = async (sess = session) => {
        try {
            const emailIsAdmin = (sess?.user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()
            if (!sess?.user?.id) {
                setIsAdmin(false)
                return
            }
            const { data } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', sess.user.id)
                .maybeSingle()
            setIsAdmin(Boolean(data?.is_admin) || emailIsAdmin)
        } catch {
            setIsAdmin(false)
        } finally {
            setRoleReady(true)
        }
    }

    // Resolve role after initial auth is known
    useEffect(() => {
        if (!authReady) return
        setRoleReady(false)
        resolveIsAdmin(session)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, session?.user?.id, session?.user?.email])

    // Load wall (admins see hidden, others don't)
    const loadPage = async (reset = false, includeHidden = false) => {
        const from = reset ? 0 : page * pageSize
        const to = from + pageSize - 1

        let query = supabase
            .from('reviews')
            .select('id, rating, body, display_name, created_at, hidden')
            .order('created_at', { ascending: false })
            .range(from, to)

        if (!includeHidden) query = query.eq('hidden', false)

        const { data, error } = await query
        if (error) { setNote('Could not load reviews.'); return }

        if (reset) {
            setReviews(data || [])
            setPage(1)
            setHasMore((data || []).length === pageSize)
        } else {
            setReviews(prev => [...prev, ...(data || [])])
            setPage(p => p + 1)
            setHasMore((data || []).length === pageSize)
        }
    }

    // Fetch first page when both gates are ready
    useEffect(() => {
        if (!authReady || !roleReady) return
        setReviews([])
        setHasMore(true)
        loadPage(true, isAdmin)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, roleReady, isAdmin])

    // Load user's existing review into composer
    useEffect(() => {
        let mounted = true
        const run = async () => {
            if (!signedIn) { setMyReview(null); setBody(''); setDisplayName(''); setRating(5); return }
            const { data, error } = await supabase
                .from('reviews')
                .select('id, rating, body, display_name')
                .eq('user_id', session.user.id)
                .maybeSingle()
            if (!mounted) return
            if (!error && data) {
                setMyReview(data)
                setRating(data.rating ?? 5)
                setBody(data.body ?? '')
                setDisplayName(data.display_name ?? '')
            }
        }
        run()
        return () => { mounted = false }
    }, [signedIn, session?.user?.id])

    // Helpers
    const userCanReview = async () => {
        if (!signedIn) return false
        const { data, error } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', session.user.id)
            .in('status', ['paid', 'succeeded', 'complete'])
            .limit(1)
        if (error) return false
        return (data || []).length > 0
    }

    const saveReview = async () => {
        setNote('')
        if (!signedIn) return setNote('Please sign in to leave a review.')
        if ((body || '').trim().length < 5) return setNote('Please write at least 5 characters.')
        if (rating < 1 || rating > 5) return setNote('Rating must be 1–5.')

        const ok = await userCanReview()
        if (!ok) return setNote('Reviews are limited to customers who completed an order.')

        const row = { user_id: session.user.id, rating, body, display_name: displayName || null }
        const { data, error } = myReview
            ? await supabase.from('reviews').update(row).eq('id', myReview.id).select().single()
            : await supabase.from('reviews').insert(row).select().single()

        if (error) return setNote(error.message || 'Could not save your review.')

        setMyReview(data)
        setNote('✅ Review saved!')
        await loadPage(true, isAdmin)
        wallTopRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const toggleHidden = async (rev) => {
        if (!isAdmin) return
        const nextHidden = !rev.hidden
        setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, hidden: nextHidden } : r))
        const { error } = await supabase.from('reviews').update({ hidden: nextHidden }).eq('id', rev.id)
        if (error) {
            setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, hidden: rev.hidden } : r))
            setNote(error.message || 'Failed to update review.')
            return
        }
        await loadPage(true, isAdmin)
    }

    const visibleForAverage = useMemo(() => reviews.filter(r => !r.hidden), [reviews])
    const avg = useMemo(() => {
        if (!visibleForAverage.length) return null
        return (visibleForAverage.reduce((a, r) => a + (r.rating || 0), 0) / visibleForAverage.length).toFixed(1)
    }, [visibleForAverage])
    const fmtDate = (d) => new Date(d).toLocaleDateString()

    // Gate UI until both are ready
    if (!authReady || !roleReady) {
        return (
            <div className="reviews-wall-wrap">
                <div className="reviews-bar card" />
                <div className="reviews-wall-skeleton card">Loading reviews…</div>
            </div>
        )
    }

    const signedInNow = !!session?.user

    return (
        <div className="reviews-wall-wrap">
            <div className="reviews-bar card" ref={wallTopRef}>
                <div>
                    <div className="tiny muted">Average rating</div>
                    <div className="avg-line">
                        <strong>{avg ? `${avg} / 5` : 'No reviews yet'}</strong>
                        <span className="stars readonly" aria-hidden="true">
                            {[1, 2, 3, 4, 5].map(n =>
                                <span key={n} className={`star ${avg && n <= Math.round(avg) ? 'on' : ''}`}>★</span>
                            )}
                        </span>
                    </div>
                </div>
                <div className="tiny muted">
                    {visibleForAverage.length} review{visibleForAverage.length === 1 ? '' : 's'}
                    {isAdmin && (
                        <span className="tiny" style={{ marginLeft: 8, opacity: .8 }}>
                            • Admin view: {reviews.length} total (incl. hidden)
                        </span>
                    )}
                </div>
            </div>

            <div className="reviews-wall" key={isAdmin ? 'admin' : 'user'}>
                {reviews.map(r => (
                    <article key={r.id} className={`review-card card ${r.hidden ? 'is-hidden' : ''}`}>
                        <div className="review-card-top">
                            <div className="review-card-stars" aria-hidden="true">
                                {[1, 2, 3, 4, 5].map(n =>
                                    <span key={n} className={`star ${n <= r.rating ? 'on' : ''}`}>★</span>
                                )}
                            </div>
                            {isAdmin && (
                                <button
                                    type="button"
                                    className={`pill ${r.hidden ? 'pill-warn' : 'pill-ghost'}`}
                                    onClick={() => toggleHidden(r)}
                                    title={r.hidden ? 'Unhide review' : 'Hide review'}
                                >
                                    {r.hidden ? 'Unhide' : 'Hide'}
                                </button>
                            )}
                        </div>

                        <p className="review-body">{r.body}</p>
                        <div className="review-meta tiny muted">
                            {r.display_name ? r.display_name : 'Verified customer'} • {fmtDate(r.created_at)}
                            {r.hidden && isAdmin && <span style={{ marginLeft: 8, color: 'var(--caution)' }}>(Hidden)</span>}
                        </div>
                    </article>
                ))}
                {!reviews.length && (
                    <div className="small muted" style={{ padding: 12 }}>No reviews yet.</div>
                )}
            </div>

            {hasMore && (
                <div className="load-more-wrap">
                    <button className="mini-btn" onClick={() => loadPage(false, isAdmin)}>Load more</button>
                </div>
            )}

            {/* Bottom centered composer */}
            <div className="composer-dock">
                <article className="card composer-inner">
                    {!signedInNow ? (
                        <div>
                            <h4 className="composer-title">Leave a review</h4>
                            <p className="small muted" style={{ marginTop: 0 }}>
                                Sign in to post a review (customers only).
                            </p>
                            <a className="cta" href="/account">Sign In / Create Account</a>
                        </div>
                    ) : (
                        <div>
                            <h4 className="composer-title">{myReview ? 'Edit your review' : 'Leave a review'}</h4>
                            <label className="tiny">Rating</label>
                            <StarPicker value={rating} onChange={setRating} />
                            <label className="tiny" style={{ marginTop: 8 }}>Your review</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="How did we do?"
                                rows={4}
                            />
                            <label className="tiny" style={{ marginTop: 6 }}>Display name (optional)</label>
                            <input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="e.g., J. Smith, Surprise"
                            />
                            <button className="cta" type="button" onClick={saveReview} style={{ marginTop: 10 }}>
                                {myReview ? 'Update Review' : 'Post Review'}
                            </button>
                            {note && <p className="tiny" style={{ marginTop: 6, color: 'var(--sun)' }}>{note}</p>}
                        </div>
                    )}
                </article>
            </div>
        </div>
    )
}
