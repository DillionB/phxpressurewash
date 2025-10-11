import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

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
                >
                    ★
                </button>
            ))}
        </div>
    )
}

export default function Reviews() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    // User’s editable review state
    const [myReview, setMyReview] = useState(null) // { id, rating, body, display_name }
    const [rating, setRating] = useState(5)
    const [body, setBody] = useState('')
    const [displayName, setDisplayName] = useState('')

    // List state
    const [reviews, setReviews] = useState([])
    const [page, setPage] = useState(0)
    const pageSize = 10
    const [hasMore, setHasMore] = useState(true)
    const [note, setNote] = useState('')

    const signedIn = !!session?.user

    // Load auth session
    useEffect(() => {
        let mounted = true
            ; (async () => {
                const { data } = await supabase.auth.getSession()
                if (!mounted) return
                setSession(data.session || null)
                setLoading(false)
            })()
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s))
        return () => { mounted = false; sub?.subscription?.unsubscribe?.() }
    }, [])

    // Load user's existing review (if signed in)
    useEffect(() => {
        if (!signedIn) { setMyReview(null); return }
        let mounted = true
            ; (async () => {
                const { data, error } = await supabase
                    .from('reviews')
                    .select('id, rating, body, display_name')
                    .eq('user_id', session.user.id)
                    .maybeSingle()

                if (mounted && !error) {
                    setMyReview(data || null)
                    if (data) {
                        setRating(data.rating ?? 5)
                        setBody(data.body ?? '')
                        setDisplayName(data.display_name ?? '')
                    }
                }
            })()
        return () => { mounted = false }
    }, [signedIn, session?.user?.id])

    // Load list (paged)
    const loadPage = async (reset = false) => {
        const from = reset ? 0 : page * pageSize
        const to = from + pageSize - 1
        const { data, error } = await supabase
            .from('reviews')
            .select('id, rating, body, display_name, created_at')
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) {
            setNote('Could not load reviews.')
            return
        }
        if (reset) {
            setReviews(data || [])
            setPage(0)
            setHasMore((data || []).length === pageSize)
        } else {
            setReviews(prev => [...prev, ...(data || [])])
            setHasMore((data || []).length === pageSize)
            setPage(p => p + 1)
        }
    }

    useEffect(() => { loadPage(true) }, []) // first load

    // Check “paid customer” on client before submit (we still enforce in RLS)
    const checkPaid = async () => {
        // Adjust if your table/columns differ
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
        if (!signedIn) { setNote('Please sign in to leave a review.'); return }
        if ((body || '').trim().length < 5) { setNote('Please write a few words (5+ characters).'); return }
        if (rating < 1 || rating > 5) { setNote('Rating must be 1–5.'); return }

        // Client-side check (server still enforces via RLS)
        const paid = await checkPaid()
        if (!paid) {
            setNote('It looks like you haven’t placed an order with us yet. Reviews are limited to customers.')
            return
        }

        const row = {
            user_id: session.user.id,
            rating,
            body,
            display_name: displayName || null
        }

        const { data, error } = myReview
            ? await supabase.from('reviews').update(row).eq('id', myReview.id).select().single()
            : await supabase.from('reviews').insert(row).select().single()

        if (error) {
            console.error(error)
            setNote(error.message || 'Could not save your review.')
            return
        }

        setMyReview(data)
        setNote('✅ Review saved!')
        // Refresh the board from the top (so user sees theirs)
        await loadPage(true)
    }

    const avg = useMemo(() => {
        if (!reviews.length) return null
        const sum = reviews.reduce((a, r) => a + (r.rating || 0), 0)
        return (sum / reviews.length).toFixed(1)
    }, [reviews])

    return (
        <>
            <h2 className="section-title">What Clients Say</h2>

            {/* Summary bar */}
            <div className="card" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div className="tiny muted">Average rating</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                        {avg ? `${avg} / 5` : 'No reviews yet'}
                    </div>
                </div>
                <div className="stars readonly" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} className={`star ${avg && n <= Math.round(avg) ? 'on' : ''}`}>★</span>
                    ))}
                </div>
            </div>

            {/* Editor or sign-in prompt */}
            <div className="card" style={{ marginBottom: 16 }}>
                {!signedIn ? (
                    <div>
                        <p className="small" style={{ marginTop: 0 }}>
                            Sign in to leave a review (customers only).
                        </p>
                        <a className="cta" href="/account">Sign In / Create Account</a>
                    </div>
                ) : (
                    <div>
                        <h3 style={{ marginTop: 0 }}>{myReview ? 'Edit your review' : 'Leave a review'}</h3>
                        <label className="tiny">Rating</label>
                        <StarPicker value={rating} onChange={setRating} />

                        <label className="tiny" style={{ marginTop: 8 }}>Your review</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="How did we do?"
                            rows={4}
                        />

                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                            <div>
                                <label className="tiny">Display name (optional)</label>
                                <input
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="e.g., J. Smith, Surprise"
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                <button className="cta" type="button" onClick={saveReview}>Post Review</button>
                            </div>
                        </div>

                        {note && <p className="tiny" style={{ marginTop: 6, color: 'var(--sun)' }}>{note}</p>}
                    </div>
                )}
            </div>

            {/* Review board */}
            <div className="card" style={{ padding: 0 }}>
                <div className="reviews-board">
                    {reviews.map(r => (
                        <article key={r.id} className="review-line">
                            <div className="review-stars" aria-hidden="true">
                                {[1, 2, 3, 4, 5].map(n => <span key={n} className={`star ${n <= r.rating ? 'on' : ''}`}>★</span>)}
                            </div>
                            <div className="review-body">
                                <p style={{ margin: 0 }}>{r.body}</p>
                                <div className="tiny muted" style={{ marginTop: 6 }}>
                                    {r.display_name ? r.display_name : 'Verified customer'} • {new Date(r.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </article>
                    ))}
                    {!reviews.length && (
                        <div className="small muted" style={{ padding: 12 }}>No reviews yet.</div>
                    )}
                </div>

                {hasMore && (
                    <div style={{ padding: 12 }}>
                        <button className="mini-btn" onClick={() => loadPage(false)}>Load more</button>
                    </div>
                )}
            </div>
        </>
    )
}
