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
                >★</button>
            ))}
        </div>
    )
}

export default function Reviews() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    // Composer state (user’s review)
    const [myReview, setMyReview] = useState(null)
    const [rating, setRating] = useState(5)
    const [body, setBody] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [note, setNote] = useState('')

    // Board state
    const [reviews, setReviews] = useState([])
    const [page, setPage] = useState(0)
    const pageSize = 12
    const [hasMore, setHasMore] = useState(true)
    const signedIn = !!session?.user

    // Auth bootstrap
    useEffect(() => {
        let mounted = true
            ; (async () => {
                const { data } = await supabase.auth.getSession()
                if (!mounted) return
                setSession(data.session || null)
                setLoading(false)
            })()
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s))
        return () => sub?.subscription?.unsubscribe?.()
    }, [])

    // Load user's existing review into composer
    useEffect(() => {
        if (!signedIn) { setMyReview(null); setBody(''); setDisplayName(''); setRating(5); return }
        let mounted = true
            ; (async () => {
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
            })()
        return () => { mounted = false }
    }, [signedIn, session?.user?.id])

    // Load grid page
    const loadPage = async (reset = false) => {
        const from = reset ? 0 : page * pageSize
        const to = from + pageSize - 1
        const { data, error } = await supabase
            .from('reviews')
            .select('id, rating, body, display_name, created_at')
            .order('created_at', { ascending: false })
            .range(from, to)
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
    useEffect(() => { loadPage(true) }, [])

    // Paid order check
    const checkPaid = async () => {
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
        if ((body || '').trim().length < 5) { setNote('Please write at least 5 characters.'); return }
        if (rating < 1 || rating > 5) { setNote('Rating must be 1–5.'); return }

        const paid = await checkPaid()
        if (!paid) { setNote('Reviews are limited to customers who completed an order.'); return }

        const row = {
            user_id: session.user.id,
            rating, body,
            display_name: displayName || null
        }

        const { data, error } = myReview
            ? await supabase.from('reviews').update(row).eq('id', myReview.id).select().single()
            : await supabase.from('reviews').insert(row).select().single()

        if (error) { setNote(error.message || 'Could not save your review.'); return }

        setMyReview(data)
        setNote('✅ Review saved!')
        await loadPage(true)
    }

    const avg = useMemo(() => {
        if (!reviews.length) return null
        return (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1)
    }, [reviews])

    return (
        <div className="reviews-page-wrap">
            {/* Top bar */}
            <div className="reviews-bar card">
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
                <div className="tiny muted">{reviews.length} review{reviews.length === 1 ? '' : 's'}</div>
            </div>

            {/* Centered composer/login (in-flow, not overlapping footer) */}
            <section className="composer-center card">
                {!signedIn ? (
                    <div className="composer-inner">
                        <h4 className="composer-title">Leave a review</h4>
                        <p className="small muted" style={{ marginTop: 0 }}>
                            Sign in to post a review (customers only).
                        </p>
                        <a className="cta" href="/account">Sign In / Create Account</a>
                    </div>
                ) : (
                    <div className="composer-inner">
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
            </section>

            {/* Auto-sizing grid (cards size to content) */}
            <div className="reviews-grid">
                {reviews.map(r => (
                    <article key={r.id} className="review-card card">
                        <div className="review-card-stars" aria-hidden="true">
                            {[1, 2, 3, 4, 5].map(n =>
                                <span key={n} className={`star ${n <= r.rating ? 'on' : ''}`}>★</span>
                            )}
                        </div>
                        <p className="review-body">{r.body}</p>
                        <div className="review-meta tiny muted">
                            {r.display_name ? r.display_name : 'Verified customer'} • {new Date(r.created_at).toLocaleDateString()}
                        </div>
                    </article>
                ))}
                {!reviews.length && (
                    <div className="small muted" style={{ padding: 12 }}>No reviews yet.</div>
                )}
            </div>

            {hasMore && (
                <div className="load-more-wrap">
                    <button className="mini-btn" onClick={() => loadPage(false)}>Load more</button>
                </div>
            )}
        </div>
    )
}
