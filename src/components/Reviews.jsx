import React, { useEffect, useMemo, useRef, useState } from 'react'
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
    const [myReview, setMyReview] = useState(null)
    const [rating, setRating] = useState(5)
    const [body, setBody] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(true)

    // Wall data
    const [reviews, setReviews] = useState([])
    const [page, setPage] = useState(0)
    const pageSize = 18
    const [hasMore, setHasMore] = useState(true)
    const signedIn = !!session?.user

    const wallTopRef = useRef(null)

    // Auth
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

    // Load existing review for composer
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

    // Load a page of reviews
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

    // Verify at least one paid/complete order
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
        if (!signedIn) { setNote('Please sign in to leave a review.'); return }
        if ((body || '').trim().length < 5) { setNote('Please write at least 5 characters.'); return }
        if (rating < 1 || rating > 5) { setNote('Rating must be 1–5.'); return }

        const ok = await userCanReview()
        if (!ok) { setNote('Reviews are limited to customers who completed an order.'); return }

        const row = {
            user_id: session.user.id,
            rating,
            body,
            display_name: displayName || null
        }

        const { data, error } = myReview
            ? await supabase.from('reviews').update(row).eq('id', myReview.id).select().single()
            : await supabase.from('reviews').insert(row).select().single()

        if (error) { setNote(error.message || 'Could not save your review.'); return }

        setMyReview(data)
        setNote('✅ Review saved!')

        // Optimistic: put/update at the top of the wall immediately
        setReviews(prev => {
            const filtered = prev.filter(r => r.id !== data.id)
            return [{ ...data, created_at: new Date().toISOString() }, ...filtered]
        })
        // jump to top so they see it
        wallTopRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const avg = useMemo(() => {
        if (!reviews.length) return null
        return (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1)
    }, [reviews])

    const fmtDate = (d) => new Date(d).toLocaleDateString()

    return (
        <div className="reviews-wall-wrap">
            {/* Header bar */}
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
                <div className="tiny muted">{reviews.length} review{reviews.length === 1 ? '' : 's'}</div>
            </div>

            {/* Masonry wall using CSS columns; composer is a card in the wall */}
            <div className="reviews-wall">
                {/* Composer/Login card */}
                <article className="review-card card composer-card">
                    {!signedIn ? (
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

                {/* Review cards */}
                {reviews.map(r => (
                    <article key={r.id} className="review-card card">
                        <div className="review-card-stars" aria-hidden="true">
                            {[1, 2, 3, 4, 5].map(n =>
                                <span key={n} className={`star ${n <= r.rating ? 'on' : ''}`}>★</span>
                            )}
                        </div>
                        <p className="review-body">{r.body}</p>
                        <div className="review-meta tiny muted">
                            {r.display_name ? r.display_name : 'Verified customer'} • {fmtDate(r.created_at)}
                        </div>
                    </article>
                ))}
            </div>

            {hasMore && (
                <div className="load-more-wrap">
                    <button className="mini-btn" onClick={() => loadPage(false)}>Load more</button>
                </div>
            )}
        </div>
    )
}
