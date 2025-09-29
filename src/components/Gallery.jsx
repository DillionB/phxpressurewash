import React from 'react'

export default function Gallery(){
  return (
    <>
      <h2 className="section-title">Before & After</h2>
      <p className="section-sub">A few quick examples. Replace with client photos as you go.</p>
      <div className="gallery" aria-label="Before and after gallery">
        {Array.from({ length: 6 }).map((_, i) => (
          <figure key={i} className={i % 2 === 1 ? 'after' : undefined}></figure>
        ))}
      </div>
    </>
  )
}
