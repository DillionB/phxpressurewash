// Phoenix Pressure Washing Company — Single‑file React app (JavaScript only)
// Drop this into a Vite/CRA project as App.jsx and run. No TypeScript.
// Uses custom CSS variables + utility classes; no external UI libs.

import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  // --- State for contact form ---
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    service: "",
    message: "",
  });
  const [note, setNote] = useState("");
  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    // Inject Google Fonts once
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Alfa+Slab+One&display=swap";
    document.head.appendChild(link);

    // Smooth-scroll for internal anchor links
    const onClick = (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // naive validation
    if (!form.name || !form.phone || !form.email) {
      setNote("Please fill out name, phone, and email.");
      return;
    }
    // Simulate a submit; wire to backend/email later
    setNote(
      "Thanks! Your request is saved locally — connect this form to email/CRM to receive submissions."
    );
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }}>
      {/* Theme styles */}
      <style>{css}</style>

      {/* JSON-LD for Local Business */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Phoenix Pressure Washing Company",
            url: "https://phoenixwash.co/",
            telephone: "+1-623-313-8176",
            areaServed: ["Phoenix AZ", "Surprise AZ", "Peoria AZ"],
            address: { "@type": "PostalAddress", addressLocality: "Phoenix", addressRegion: "AZ", addressCountry: "US" },
            priceRange: "$$",
            description:
              "Professional pressure and soft washing for homes and businesses across Phoenix, Surprise, and Peoria.",
          }),
        }}
      />

      {/* Topbar */}
      <header className="topbar">
        <div className="wrap nav">
          <a className="brand" href="#home" aria-label="Phoenix Pressure Washing Company home">
            <span className="logo-mark" aria-hidden="true" />
            <span className="brand-title">
              <b>PHOENIX</b>
              <span className="brand-sub">Pressure Washing Co.</span>
            </span>
          </a>
          <nav className="navlinks" aria-label="Primary">
            <a href="#services">Services</a>
            <a href="#coverage">Service Areas</a>
            <a href="#gallery">Gallery</a>
            <a href="#reviews">Reviews</a>
            <a href="#contact">Contact</a>
          </nav>
          <a className="cta" href="#contact">
            Get a Free Quote
          </a>
        </div>
      </header>

      {/* Hero */}
      <main id="home" className="wrap hero">
        <div className="hero-grid">
          <div>
            <span className="tag" role="note">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2l2.39 4.84L20 8.27l-3.64 3.55L17.48 18 12 15.27 6.52 18l1.12-6.18L4 8.27l5.61-1.43L12 2z" stroke="var(--sun)" />
              </svg>
              Veteran detail • Commercial & Residential
            </span>
            <h1>
              <span className="sun">Phoenix</span> Pressure Washing Company
            </h1>
            <p>
              Premium exterior cleaning with a rugged Western edge. We restore curb
              appeal for homes, HOAs, and businesses across <b>Phoenix</b>, <b>Surprise</b>, and
              <b> Peoria</b>—using pro‑grade equipment, soft‑wash chemistry, and careful detail.
            </p>
            <div className="hero-cta">
              <a className="cta" href="#contact">
                Request Quote
              </a>
              <a className="badge" href="#coverage">
                <span>📍</span> Phoenix • Surprise • Peoria
              </a>
            </div>
          </div>
          <div className="card emblem" aria-hidden="true">
            <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#173E3E" />
                  <stop offset="1" stopColor="#0E2626" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#g1)" />
              <g fill="none" stroke="#2C8C8C" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
                <path d="M80 540 C220 380, 360 420, 520 520" />
                <path d="M560 540 c20 -120 20 -220 0 -340 m0 0 c120 40 140 320 0 340" />
                <path d="M140 660 H660" />
              </g>
              <g fill="#F28A1E" opacity="0.9">
                <rect x="120" y="120" width="100" height="12" rx="6" />
                <rect x="240" y="120" width="100" height="12" rx="6" />
                <rect x="360" y="120" width="100" height="12" rx="6" />
              </g>
            </svg>
          </div>
        </div>
      </main>

      <div className="pattern" aria-hidden="true" />

      {/* Services */}
      <section id="services" className="wrap">
        <h2 className="section-title">Professional Services</h2>
        <p className="section-sub">
          Commercial & residential exterior cleaning backed by pro equipment and safe
          methods.
        </p>
        <div className="grid cols-3">
          {services.map((s) => (
            <article className="service" key={s.title}>
              <div className="badge">{s.badge}</div>
              <h3>{s.title}</h3>
              <p>{s.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Coverage */}
      <section id="coverage" className="wrap coverage">
        <h2 className="section-title">Service Areas</h2>
        <p className="section-sub">Proudly serving the Northwest Valley.</p>
        <ul>
          <li>
            <b>Phoenix</b> — North, Central & West Phoenix
          </li>
          <li>
            <b>Surprise</b> — Marley Park, Sierra Verde, Asante
          </li>
          <li>
            <b>Peoria</b> — Vistancia, Parkridge, Fletcher Heights
          </li>
          <li>Glendale • Sun City • El Mirage</li>
          <li>Waddell • Litchfield Park • Goodyear</li>
        </ul>
      </section>

      {/* Gallery */}
      <section id="gallery" className="wrap">
        <h2 className="section-title">Before & After</h2>
        <p className="section-sub">A few quick examples. Replace with client photos as you go.</p>
        <div className="gallery" aria-label="Before and after gallery">
          {Array.from({ length: 6 }).map((_, i) => (
            <figure key={i} className={i % 2 === 1 ? "after" : undefined} />
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="wrap">
        <h2 className="section-title">What Clients Say</h2>
        <div className="quotes">
          <blockquote>
            “Our driveway looks brand new. Fast and professional.”
            <br />
            <b>— K. Ramirez, Peoria</b>
          </blockquote>
          <blockquote>
            “Great storefront wash before a big sale. Will book monthly.”
            <br />
            <b>— R. Patel, Phoenix</b>
          </blockquote>
          <blockquote>
            “They handled our HOA sidewalks and common areas without a hitch.”
            <br />
            <b>— J. Thompson, Surprise</b>
          </blockquote>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="wrap">
        <h2 className="section-title">Request a Free Quote</h2>
        <p className="section-sub">
          Tell us a bit about your property and we’ll reply with a same‑week slot.
        </p>
        <form onSubmit={onSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" value={form.name} onChange={onChange} autoComplete="name" required />
          </div>
          <div>
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone} onChange={onChange} inputMode="tel" autoComplete="tel" required />
          </div>
          <div className="full">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" required />
          </div>
          <div>
            <label htmlFor="city">City</label>
            <select id="city" name="city" value={form.city} onChange={onChange} required>
              <option value="" disabled>
                Select
              </option>
              <option>Phoenix</option>
              <option>Surprise</option>
              <option>Peoria</option>
              <option>Glendale</option>
              <option>Sun City</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="service">Service</label>
            <select id="service" name="service" value={form.service} onChange={onChange} required>
              <option value="" disabled>
                Select
              </option>
              <option>House Soft Wash</option>
              <option>Driveway / Concrete</option>
              <option>Storefront / Commercial</option>
              <option>Solar Panels</option>
              <option>Walls / Fences</option>
              <option>Rust / Calcium Treatment</option>
            </select>
          </div>
          <div className="full">
            <label htmlFor="message">Project Details</label>
            <textarea id="message" name="message" value={form.message} onChange={onChange} placeholder="Square footage, surfaces, timing…" />
          </div>
          <div className="full">
            <button className="cta" type="submit">
              Send Request
            </button>
            <span className="small" style={{ marginLeft: 10, color: "var(--muted)" }}>
              {note}
            </span>
          </div>
        </form>
      </section>

      {/* Footer */}
      <footer>
        <div className="wrap footgrid">
          <div>
            <div className="brand" style={{ gap: 10 }}>
              <span className="logo-mark" aria-hidden="true" />
              <div className="brand-title">
                <b>PHOENIX</b>
                <span className="brand-sub">Pressure Washing Co.</span>
              </div>
            </div>
            <p className="small" style={{ marginTop: 10 }}>
              Serving Phoenix, Surprise, Peoria & the Northwest Valley.
            </p>
            <p className="small">© {year} Phoenix Pressure Washing Company. All rights reserved.</p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 8px" }}>Contact</h4>
            <p className="small">
              Phone: <a href="tel:+16233138176">(623) 313‑8176</a>
              <br />
              Email: <a href="mailto:info@phoenixwash.co">info@phoenixwash.co</a>
            </p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 8px" }}>Quick Links</h4>
            <p className="small">
              <a href="#services">Services</a>
              <br />
              <a href="#coverage">Service Areas</a>
              <br />
              <a href="#contact">Free Quote</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const services = [
  {
    badge: "🏠 House Soft Wash",
    title: "Home Exterior & Stucco",
    copy:
      "Low‑pressure soft wash that lifts desert dust from stucco, brick, and siding—no damage, just a uniform finish.",
  },
  {
    badge: "🚘 Driveways & Walkways",
    title: "Concrete, Pavers & Oil Stain Removal",
    copy:
      "Deep-clean concrete, degrease oil and tire marks, and brighten pavers with a rotary surface cleaner.",
  },
  {
    badge: "🏢 Storefronts & HOA",
    title: "Commercial Flatwork & Facades",
    copy:
      "Brand-safe storefront cleaning, gum removal, dumpster pads, and common areas with minimal downtime.",
  },
  {
    badge: "🌞 Solar Panels",
    title: "Boost Output • Gentle Rinse",
    copy:
      "Mineral-safe detergents and purified water to clear dust for better efficiency and warranty-safe maintenance.",
  },
  {
    badge: "🧱 Walls & Fences",
    title: "CMU, Block & Perimeter Walls",
    copy:
      "Remove desert grime and sprinkler stains; finish with even tone that matches surrounding surfaces.",
  },
  {
    badge: "🌵 Rust & Calcium",
    title: "Stain Treatments",
    copy:
      "Targeted chemistry for irrigation rust, efflorescence, and hard-water spotting on concrete and stone.",
  },
];

// Global CSS (mirrors the aesthetic from your HTML version)
const css = `
:root{
  --bg-deep:#0B1E1E; --bg-card:#0E2626; --line:#184848; --teal:#1F6E6E; --teal-soft:#2C8C8C;
  --sun:#F28A1E; --sun-2:#FFB15A; --sand:#E6D2B5; --ink:#F6F6F5; --muted:#C7D4D2; --radius:20px;
  --shadow:0 20px 60px rgba(0,0,0,.45), 0 8px 24px rgba(0,0,0,.35);
}
html,body{height:100%}
body{margin:0; background:radial-gradient(1200px 700px at 80% -10%, #143232 0%, var(--bg-deep) 60%) fixed; color:var(--ink); line-height:1.6}
*{box-sizing:border-box}
a{color:var(--sun)} a:hover{color:var(--sun-2)}
.wrap{max-width:1200px; margin:0 auto; padding:0 20px}
.small{font-size:13px; color:var(--muted)}

.topbar{position:sticky; top:0; backdrop-filter:saturate(120%) blur(10px); background:rgba(9,24,24,.65); border-bottom:1px solid var(--line); z-index:40}
.nav{display:flex; align-items:center; justify-content:space-between; height:68px}
.brand{display:flex; gap:14px; align-items:center; text-decoration:none}
.logo-mark{width:44px; height:44px; border-radius:12px; background:linear-gradient(140deg, var(--sun) 0%, var(--sun-2) 60%, #ffcf87 100%); box-shadow:inset 0 0 0 2px rgba(0,0,0,.25); position:relative}
.logo-mark:before{content:""; position:absolute; inset:8px; border:3px solid var(--bg-deep); border-radius:10px; clip-path: polygon(0% 90%, 15% 75%, 30% 80%, 50% 60%, 65% 66%, 80% 50%, 100% 55%, 100% 100%, 0% 100%);} /* mountains silhouette */
.brand-title{display:flex; flex-direction:column; line-height:1}
.brand-title b{font-family:"Alfa Slab One", system-ui; font-weight:400; letter-spacing:.5px; font-size:18px}
.brand-sub{font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1.8px}
.navlinks{display:flex; gap:22px}
.navlinks a{font-weight:600; font-size:14px; text-decoration:none; color:var(--muted)}
.navlinks a:hover{color:var(--ink)}
.cta{display:inline-block; padding:10px 16px; border-radius:10px; text-decoration:none; font-weight:800; letter-spacing:.4px; background:linear-gradient(180deg, var(--sun-2), var(--sun)); color:#1e1e1e}
.cta:hover{filter:brightness(1.05)}

.hero{position:relative; padding:88px 0 64px}
.hero-grid{display:grid; grid-template-columns:1.1fr .9fr; gap:40px; align-items:center}
.hero h1{font-family:"Alfa Slab One", Montserrat, system-ui; font-size: clamp(40px, 6vw, 74px); line-height:1; margin:0 0 18px; letter-spacing:.6px; text-shadow: 0 6px 30px rgba(0,0,0,.5)}
.hero h1 .sun{color:var(--sun)}
.tag{display:inline-flex; gap:10px; align-items:center; padding:8px 12px; border-radius:999px; border:1px solid var(--line); color:var(--muted); font-weight:600}
.hero p{color:var(--muted); font-size:18px; margin:14px 0 28px}
.hero-cta{display:flex; gap:14px; flex-wrap:wrap}
.card{background:linear-gradient(180deg, rgba(14,38,38,.8), rgba(10,26,26,.8)); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); padding:22px}
.emblem{aspect-ratio:1/1; border-radius:18px; border:1px solid var(--line); position:relative; overflow:hidden; background:#0d2323}
.emblem svg{position:absolute; inset:0; width:100%; height:100%}

section{padding:64px 0}
.section-title{font-family:"Alfa Slab One", Montserrat; font-size:34px; letter-spacing:.3px; margin:0 0 8px}
.section-sub{color:var(--muted); margin:0 0 26px}

.grid{display:grid; gap:20px}
.grid.cols-3{grid-template-columns:repeat(3, 1fr)}
.service{position:relative; padding:22px; border:1px solid var(--line); border-radius:18px; background:linear-gradient(180deg, #0f2626, #0b1f1f)}
.service h3{margin:10px 0 8px; font-size:20px}
.service p{margin:0; color:var(--muted)}
.badge{display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border:1px solid var(--line); border-radius:999px; color:var(--muted); font-size:12px}

.pattern{ --h:70px; position:relative; height:var(--h); margin:54px 0; border-block:1px solid var(--line); background:linear-gradient(90deg, transparent 0 2%, rgba(31,110,110,.18) 2% 4%, transparent 4% 6%)}
.pattern:before{content:""; position:absolute; inset:0; background:linear-gradient(90deg, var(--sun) 0 4%, transparent 4% 8%) bottom/40px 6px repeat-x, linear-gradient(135deg, transparent 0 46%, var(--teal) 46% 54%, transparent 54% 100%) center/90px 100% repeat-x; opacity:.35}

.coverage ul{columns:2; padding:0; margin:16px 0; list-style:none}
.coverage li{margin:8px 0; color:var(--muted)}

.gallery{display:grid; grid-template-columns:repeat(6, 1fr); gap:10px}
.gallery figure{aspect-ratio:4/3; margin:0; overflow:hidden; border-radius:14px; border:1px solid var(--line); background:#0e2424; position:relative}
.gallery figure:before{content:"Before"; position:absolute; left:10px; top:10px; font-weight:700; font-size:12px; color:#fff; background:rgba(0,0,0,.35); padding:4px 8px; border-radius:999px}
.gallery figure.after:before{content:"After"}

.quotes{display:grid; grid-template-columns:repeat(3, 1fr); gap:16px}
blockquote{margin:0; padding:18px; border-radius:14px; border:1px solid var(--line); background:linear-gradient(180deg, #0f2626, #0b1f1f); color:var(--muted)}
blockquote b{color:var(--ink)}

form{display:grid; grid-template-columns:1fr 1fr; gap:14px}
form .full{grid-column:1 / -1}
label{font-weight:600; font-size:13px; color:var(--muted)}
input, select, textarea{width:100%; padding:12px 14px; border-radius:10px; border:1px solid var(--line); background:#102727; color:var(--ink); outline:none}
input:focus, select:focus, textarea:focus{border-color:var(--teal-soft); box-shadow:0 0 0 3px rgba(44,140,140,.25)}
textarea{min-height:120px; resize:vertical}

footer{border-top:1px solid var(--line); background:linear-gradient(180deg, #0d2323, #0b1f1f); padding:32px 0 60px; color:var(--muted)}
.footgrid{display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:24px}

@media (max-width: 960px){
  .hero-grid{grid-template-columns:1fr; text-align:center}
  .navlinks{display:none}
  .gallery{grid-template-columns:repeat(3, 1fr)}
  .quotes{grid-template-columns:1fr}
  .grid.cols-3{grid-template-columns:1fr}
  .coverage ul{columns:1}
  form{grid-template-columns:1fr}
}
`;
