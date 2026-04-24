import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import vinoth from "./assets/vinoth.png";
import arun from "./assets/arun.png";
import john from "./assets/john.png";
/* ══════════════════════════════════════════════
   DESIGN TOKENS — Purple / Blue / Black
══════════════════════════════════════════════ */
const C = {
  black:       "#05050f",
  darkBg:      "#080818",
  cardBg:      "#0d0d22",
  cardBg2:     "#10102a",
  purple:      "#7c3aed",
  purpleLight: "#a855f7",
  purpleDark:  "#5b21b6",
  blue:        "#2563eb",
  blueLight:   "#60a5fa",
  blueMid:     "#3b82f6",
  cyan:        "#06b6d4",
  text:        "#f1f5f9",
  muted:       "#94a3b8",
  border:      "rgba(124,58,237,0.18)",
  borderBlue:  "rgba(37,99,235,0.25)",
  glow:        "rgba(124,58,237,0.25)",
};

const grad = (a = C.purple, b = C.blue) =>
  `linear-gradient(135deg, ${a}, ${b})`;

/* ══════════════════════════════════════════════
   GSAP LOADER
══════════════════════════════════════════════ */
let gsapReady = false;
const gsapCbs = [];

function loadGSAP(cb) {
  if (gsapReady) { cb(); return; }
  gsapCbs.push(cb);
  if (document.getElementById("gsap-script")) return;
  const s1 = document.createElement("script");
  s1.id = "gsap-script";
  s1.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
  s1.onload = () => {
    const s2 = document.createElement("script");
    s2.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";
    s2.onload = () => {
      window.gsap.registerPlugin(window.ScrollTrigger);
      gsapReady = true;
      gsapCbs.forEach(fn => fn());
    };
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
}

function useGSAPReveal(selector, options = {}) {
  const ref = useRef(null);
  useEffect(() => {
    loadGSAP(() => {
      const g = window.gsap;
      const ST = window.ScrollTrigger;
      const els = ref.current
        ? ref.current.querySelectorAll(selector)
        : document.querySelectorAll(selector);
      els.forEach((el, i) => {
        g.fromTo(el,
          { opacity: 0, y: options.y ?? 60, scale: options.scale ?? 1 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: options.duration ?? 0.85,
            delay: (i % (options.cols ?? 3)) * (options.stagger ?? 0.13),
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    });
  }, []);
  return ref;
}

/* ══════════════════════════════════════════════
   THREE.JS HERO CANVAS
══════════════════════════════════════════════ */
function HeroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.z = 8;

    /* ─ Particles ─ */
    const N = 3000;
    const pos = new Float32Array(N * 3);
    const cols = new Float32Array(N * 3);
    const palette = [
      new THREE.Color(C.purple),
      new THREE.Color(C.blue),
      new THREE.Color(C.cyan),
      new THREE.Color(C.purpleLight),
      new THREE.Color(C.blueLight),
    ];
    for (let i = 0; i < N; i++) {
      const r = 3 + Math.random() * 5;
      const θ = Math.random() * Math.PI * 2;
      const φ = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(φ) * Math.cos(θ);
      pos[i*3+1] = r * Math.sin(φ) * Math.sin(θ);
      pos[i*3+2] = r * Math.cos(φ);
      const c = palette[Math.floor(Math.random() * palette.length)];
      cols[i*3] = c.r; cols[i*3+1] = c.g; cols[i*3+2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute("color",    new THREE.BufferAttribute(cols, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.9 });
    const pts = new THREE.Points(pGeo, pMat);
    scene.add(pts);

    /* ─ Rings ─ */
    const makeRing = (r, thick, color, rx, ry) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(r, thick, 16, 120),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 })
      );
      m.rotation.x = rx; m.rotation.y = ry;
      scene.add(m); return m;
    };
    const ring1 = makeRing(2.5, 0.015, C.purple,   Math.PI/3, 0);
    const ring2 = makeRing(3.4, 0.010, C.blue,    -Math.PI/4, Math.PI/5);
    const ring3 = makeRing(1.8, 0.008, C.cyan,     Math.PI/6, Math.PI/3);

    /* ─ Glowing sphere ─ */
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 64, 64),
      new THREE.MeshBasicMaterial({ color: C.purple, transparent: true, opacity: 0.15, wireframe: true })
    );
    scene.add(sphere);

    /* ─ Icosahedron ─ */
    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2, 1),
      new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.08, wireframe: true })
    );
    scene.add(ico);

    let mx = 0, my = 0;
    const onMM = e => { mx = (e.clientX / W - 0.5) * 2; my = -(e.clientY / H - 0.5) * 2; };
    window.addEventListener("mousemove", onMM);

    let t = 0, raf;
    const animate = () => {
      t += 0.007;
      pts.rotation.y = t * 0.06 + mx * 0.06;
      pts.rotation.x = t * 0.03 + my * 0.04;
      ring1.rotation.z = t * 0.25;
      ring2.rotation.z = -t * 0.18;
      ring2.rotation.x = -Math.PI/4 + Math.sin(t * 0.3) * 0.1;
      ring3.rotation.z = t * 0.35;
      ring3.rotation.y = Math.sin(t * 0.2) * 0.5;
      sphere.rotation.y = t * 0.1;
      sphere.rotation.x = t * 0.05;
      ico.rotation.y = -t * 0.15;
      ico.rotation.x = t * 0.08;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      W = el.clientWidth; H = el.clientHeight;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMM);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />;
}

/* ══════════════════════════════════════════════
   FLOATING 3D BACKGROUND (subtle, for sections)
══════════════════════════════════════════════ */
function MiniCanvas({ id }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H); renderer.setPixelRatio(1.5);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 5;
    const N = 600; const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i*3] = (Math.random()-0.5)*10;
      pos[i*3+1] = (Math.random()-0.5)*6;
      pos[i*3+2] = (Math.random()-0.5)*4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: id % 2 === 0 ? C.purple : C.blue, size: 0.03, transparent: true, opacity: 0.4 }));
    scene.add(pts);
    let t = 0, raf;
    const animate = () => { t += 0.005; pts.rotation.y = t * 0.05; pts.rotation.x = t * 0.03; renderer.render(scene, camera); raf = requestAnimationFrame(animate); };
    raf = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(raf); renderer.dispose(); if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, []);
  return <div ref={ref} style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.5 }} />;
}

/* ══════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════ */
const NAV = ["Home","Services","Team","Portfolio","Testimonials","Contact"];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    // GSAP nav entrance
    loadGSAP(() => {
      window.gsap.fromTo("nav .nav-inner",
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power4.out" }
      );
    });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const go = id => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? "rgba(5,5,15,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        transition: "all 0.4s ease",
      }}>
        <div className="nav-inner" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 5%", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => go("Home")}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: grad(),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Clash Display',sans-serif", fontWeight: 800, fontSize: 17, color: "#fff",
              boxShadow: `0 0 20px ${C.glow}`,
            }}>JS</div>
            <div>
              <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", letterSpacing: 1 }}>JStudio</div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2 }}>YOUR DIGITAL PARTNER</div>
            </div>
          </div>

          {/* Links */}
          <div className="nl" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {NAV.map(l => (
              <button key={l} onClick={() => go(l)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted,
                fontSize: 14, fontWeight: 600, padding: 0, letterSpacing: 0.3,
                transition: "color 0.2s",
              }}
                onMouseEnter={e => e.target.style.color = "#fff"}
                onMouseLeave={e => e.target.style.color = C.muted}
              >{l}</button>
            ))}
          </div>

          {/* CTAs */}
          <div className="nc" style={{ display: "flex", gap: 10 }}>
            <a href="mailto:vinodjayasudha@gmail.com" style={{
              border: `1px solid ${C.border}`, color: C.purpleLight,
              padding: "9px 20px", borderRadius: 8, textDecoration: "none",
              fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13,
              transition: "all 0.2s", background: "rgba(124,58,237,0.08)",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.2)"; e.currentTarget.style.borderColor = C.purpleLight; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.borderColor = C.border; }}
            >Internships</a>
            <a href="tel:9380334317" style={{
              background: grad(), color: "#fff",
              padding: "9px 22px", borderRadius: 8, textDecoration: "none",
              fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13,
              boxShadow: `0 4px 20px ${C.glow}`, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${C.glow}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${C.glow}`; }}
            >Hire Us</a>
          </div>

          {/* Hamburger */}
          <button onClick={() => setOpen(!open)} className="hbg"
            style={{ display: "none", background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#fff" }}>
            {open ? "✕" : "☰"}
          </button>
        </div>

        {open && (
          <div style={{
            background: "rgba(5,5,15,0.98)", backdropFilter: "blur(20px)",
            borderTop: `1px solid ${C.border}`, padding: "20px 5%",
            display: "flex", flexDirection: "column", gap: 18,
          }}>
            {NAV.map(l => (
              <button key={l} onClick={() => go(l)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#fff",
                fontSize: 18, fontWeight: 700, textAlign: "left",
              }}>{l}</button>
            ))}
            <a href="tel:9380334317" style={{
              background: grad(), color: "#fff", padding: "14px 24px",
              borderRadius: 8, textDecoration: "none", fontWeight: 700, textAlign: "center",
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}>Hire Us</a>
          </div>
        )}
      </nav>
      <style>{`@media(max-width:960px){.nl{display:none!important}.nc{display:none!important}.hbg{display:block!important}}`}</style>
    </>
  );
}

/* ══════════════════════════════════════════════
   HERO
══════════════════════════════════════════════ */
function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    loadGSAP(() => {
      const g = window.gsap;
      const tl = g.timeline({ delay: 0.3 });
      tl.fromTo(".hero-badge",   { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(2)" })
        .fromTo(".hero-h1",      { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
        .fromTo(".hero-h1-2",    { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.5")
        .fromTo(".hero-sub",     { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.4")
        .fromTo(".hero-btns",    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.3")
        .fromTo(".hero-stats",   { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.2")
        .fromTo(".hero-visual",  { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 1.0, ease: "power3.out" }, "-=0.8");

      // Floating animation for badges
      g.to(".floating-badge", { y: -10, duration: 2, ease: "sine.inOut", repeat: -1, yoyo: true, stagger: 0.4 });
    });
  }, []);

  const stats = [
    { n: "50+", l: "Projects" }, { n: "10+", l: "Clients" },
    { n: "5+", l: "Services" }, { n: "24/7", l: "Support" },
  ];

  return (
    <section id="home" style={{
      position: "relative", minHeight: "100vh", paddingTop: 72,
      background: `radial-gradient(ellipse 120% 70% at 50% -10%, rgba(124,58,237,0.2) 0%, transparent 60%),
                   radial-gradient(ellipse 80% 50% at 80% 80%, rgba(37,99,235,0.15) 0%, transparent 60%),
                   ${C.black}`,
      display: "flex", alignItems: "center", overflow: "hidden",
    }}>
      <HeroCanvas />

      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: "60px 60px", opacity: 0.4,
      }} />

      <div ref={heroRef} style={{ maxWidth: 1280, margin: "0 auto", padding: "60px 5%", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", position: "relative", zIndex: 2 }} className="hero-grid">

        {/* LEFT */}
        <div>
          <div className="hero-badge" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(124,58,237,0.12)", border: `1px solid rgba(124,58,237,0.35)`,
            borderRadius: 50, padding: "8px 20px", marginBottom: 28,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.purpleLight, animation: "bpulse 2s infinite" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.purpleLight, fontWeight: 700, letterSpacing: 2 }}>DESIGN · DEVELOP · GROW</span>
          </div>

          <h1 className="hero-h1" style={{
            fontFamily: "'Clash Display',sans-serif",
            fontSize: "clamp(2.2rem,5.5vw,4.2rem)",
            fontWeight: 700, color: "#fff", lineHeight: 1.05, margin: "0 0 8px",
          }}>Build Your Business</h1>
          <h1 className="hero-h1-2" style={{
            fontFamily: "'Clash Display',sans-serif",
            fontSize: "clamp(2.2rem,5.5vw,4.2rem)",
            fontWeight: 700, lineHeight: 1.05, margin: "0 0 28px",
            background: `linear-gradient(90deg, ${C.purpleLight}, ${C.blueLight}, ${C.cyan})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>with Proven Digital Solutions</h1>

          <p className="hero-sub" style={{
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            color: C.muted, fontSize: 16, lineHeight: 1.85, maxWidth: 520, marginBottom: 40,
          }}>
            We build stunning websites, web applications, SaaS platforms, CRM systems, and full digital marketing solutions — for startups, businesses, and clients across India and worldwide.
          </p>

          <div className="hero-btns" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 56 }}>
            <button onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })} style={{
              background: grad(), color: "#fff", border: "none", cursor: "pointer",
              padding: "14px 32px", borderRadius: 10, fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 700, fontSize: 15, boxShadow: `0 0 30px ${C.glow}`,
              transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 10px 40px rgba(124,58,237,0.5)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 0 30px ${C.glow}`; }}
            >Explore Services →</button>
            <button onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })} style={{
              border: `1px solid ${C.border}`, color: "#fff", cursor: "pointer",
              padding: "14px 32px", borderRadius: 10, background: "rgba(255,255,255,0.04)",
              fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15,
              transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = C.purpleLight; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = C.border; }}
            >Get Free Quote</button>
          </div>

          <div className="hero-stats" style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            {stats.map((s, i) => (
              <div key={i} style={{ borderLeft: `2px solid ${C.purple}`, paddingLeft: 16 }}>
                <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 700, background: grad(), WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.n}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 13 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT VISUAL */}
        <div className="hero-visual" style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
          {/* Central orb */}
          <div style={{
            width: 340, height: 340, borderRadius: "50%",
            background: `radial-gradient(circle at 35% 35%, rgba(124,58,237,0.25), rgba(37,99,235,0.1) 60%, transparent)`,
            border: `1px solid rgba(124,58,237,0.3)`,
            boxShadow: `0 0 60px rgba(124,58,237,0.2), inset 0 0 60px rgba(124,58,237,0.08)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            animation: "orb-float 6s ease-in-out infinite",
          }}>
            {/* Inner ring */}
            <div style={{
              width: 240, height: 240, borderRadius: "50%",
              border: `1px solid rgba(96,165,250,0.3)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "spin-slow 12s linear infinite",
            }}>
              <div style={{
                width: 140, height: 140, borderRadius: "50%",
                background: grad("rgba(124,58,237,0.3)", "rgba(37,99,235,0.2)"),
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 40px rgba(124,58,237,0.3)`,
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 42, marginBottom: 4 }}>🚀</div>
                  <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>JStudio</div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            {[
              { ic: "🌐", lb: "Web Dev",  top: "-14%", left: "-16%", delay: "0s" },
              { ic: "🎨", lb: "Design",   top: "-14%", right: "-16%", delay: "0.7s" },
              { ic: "⚙️", lb: "SaaS",    bottom: "-8%", left: "5%", delay: "1.2s" },
              { ic: "📱", lb: "Apps",     bottom: "0%", right: "-14%", delay: "1.8s" },
            ].map((b, i) => (
              <div key={i} className="floating-badge" style={{
                position: "absolute",
                ...(b.top && { top: b.top }), ...(b.bottom && { bottom: b.bottom }),
                ...(b.left && { left: b.left }), ...(b.right && { right: b.right }),
                background: "rgba(13,13,34,0.95)",
                border: `1px solid ${C.border}`,
                borderRadius: 12, padding: "11px 16px",
                display: "flex", alignItems: "center", gap: 9,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 16px ${C.glow}`,
                backdropFilter: "blur(10px)",
                animationDelay: b.delay,
              }}>
                <span style={{ fontSize: 20 }}>{b.ic}</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13, color: "#fff", whiteSpace: "nowrap" }}>{b.lb}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: `linear-gradient(transparent, ${C.black})`, zIndex: 2, pointerEvents: "none" }} />

      <style>{`
        @keyframes bpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }
        @keyframes orb-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media(max-width:768px){.hero-grid{grid-template-columns:1fr!important;text-align:center} .hero-stats{justify-content:center} .hero-btns{justify-content:center}}
      `}</style>
    </section>
  );
}

/* ══════════════════════════════════════════════
   SERVICES
══════════════════════════════════════════════ */
const SERVICES = [
  { ic: "🌐", title: "Custom Web Development", sub: "From Idea to Live Product", featured: false,
    desc: "Full-stack websites and web apps built with React, Node.js, PHP, and MySQL — fast, secure, built to scale.",
    pts: ["React / Next.js frontends", "PHP + MySQL / Node.js backends", "REST API design & integration", "Admin dashboards & portals", "Authentication & RBAC management"],
    cta: "Start Your Project →" },
  { ic: "🛒", title: "Business & E-Commerce", sub: "Sites That Convert Visitors", featured: true,
    desc: "Professional websites with speed, SEO, and a clear call to action — not just a pretty template.",
    pts: ["Corporate & portfolio sites", "Online stores with payment gateway", "Product & service landing pages", "Booking & enquiry systems", "SEO-ready from day one"],
    cta: "Get a Free Quote →" },
  { ic: "🎨", title: "Logo & Banner Design", sub: "Your Brand, Perfected", featured: false,
    desc: "Eye-catching logos, banners, and brand identity that make your business unforgettable online.",
    pts: ["Logo & brand identity design", "Social media banners & ads", "Digital marketing creatives", "Business card & stationery", "Brand guideline document"],
    cta: "Design My Brand →" },
  { ic: "🗄️", title: "SaaS & Platform Dev", sub: "Multi-Tenant Platforms", featured: false,
    desc: "Subscription systems, client portals, and platforms built for real usage at scale.",
    pts: ["Subscription & billing systems", "Multi-user portals with roles", "Real-time messaging & notifications", "File uploads, reports & exports", "Stripe / Razorpay integration"],
    cta: "Build My Platform →" },
  { ic: "📋", title: "CRM & Internal Tools", sub: "Replace Your Spreadsheets", featured: true,
    desc: "Custom business software that automates operations and replaces manual work — live and in use.",
    pts: ["Client & lead management", "Document generation & PDF export", "Task tracking & team workflows", "Custom reports & dashboards", "Fully private on your server"],
    cta: "Automate My Business →" },
  { ic: "🛡️", title: "Support, Fixes & Upgrades", sub: "Fast Turnaround Guaranteed", featured: false,
    desc: "Already have a site or app that needs help? We fix bugs, improve performance, and add features fast.",
    pts: ["Bug fixes & emergency patches", "Speed & performance optimization", "Feature additions to existing apps", "Security hardening & updates", "12-hour response SLA via email"],
    cta: "Fix My Project →" },
];

function Services() {
  const secRef = useGSAPReveal(".svc-card", { y: 70, stagger: 0.12, cols: 3 });

  useEffect(() => {
    loadGSAP(() => {
      window.gsap.fromTo(".svc-heading", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".svc-heading", start: "top 85%" } });
    });
  }, []);

  return (
    <section id="services" ref={secRef} style={{
      padding: "120px 5%", position: "relative", overflow: "hidden",
      background: `linear-gradient(180deg, ${C.black} 0%, ${C.darkBg} 50%, ${C.black} 100%)`,
    }}>
      <MiniCanvas id={0} />
      {/* Glow blobs */}
      <div style={{ position: "absolute", top: "20%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, rgba(124,58,237,0.07), transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "20%", left: "-5%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, rgba(37,99,235,0.07), transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="svc-heading" style={{ textAlign: "center", marginBottom: 70 }}>
          <div style={{ display: "inline-block", background: "rgba(124,58,237,0.12)", border: `1px solid ${C.border}`, borderRadius: 50, padding: "6px 20px", marginBottom: 18 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.purpleLight, fontWeight: 700, letterSpacing: 2 }}>OUR SERVICES</span>
          </div>
          <h2 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: 14, lineHeight: 1.15 }}>
            What We <span style={{ background: grad(), WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Deliver</span>
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 16, maxWidth: 560, margin: "0 auto", lineHeight: 1.75 }}>
            No generalist fluff. Just clean, scalable, production-ready digital work — from design to deployment.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 24 }}>
          {SERVICES.map((s, i) => <SvcCard key={i} s={s} />)}
        </div>
      </div>
    </section>
  );
}

function SvcCard({ s }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="svc-card"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `linear-gradient(145deg, rgba(124,58,237,0.12), ${C.cardBg})` : C.cardBg,
        border: `1px solid ${hov ? "rgba(124,58,237,0.5)" : C.border}`,
        borderTop: `2px solid ${s.featured || hov ? C.purple : C.border}`,
        borderRadius: 16, padding: "32px 28px",
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        transform: hov ? "translateY(-8px)" : "translateY(0)",
        boxShadow: hov ? `0 24px 60px rgba(0,0,0,0.5), 0 0 30px rgba(124,58,237,0.15)` : "none",
        cursor: "default",
      }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: grad(),
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, marginBottom: 22,
        boxShadow: `0 0 20px ${C.glow}`,
        transition: "transform 0.35s",
        transform: hov ? "rotate(-8deg) scale(1.1)" : "rotate(0)",
      }}>{s.ic}</div>

      <h3 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 18, fontWeight: 600, color: s.featured ? C.purpleLight : "#fff", margin: "0 0 5px" }}>{s.title}</h3>
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 14, textTransform: "uppercase" }}>{s.sub}</div>
      <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 14, lineHeight: 1.75, marginBottom: 20 }}>{s.desc}</p>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
        {s.pts.map((p, j) => (
          <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: grad(), flexShrink: 0, marginTop: 7, boxShadow: `0 0 6px ${C.glow}` }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.text, fontSize: 13.5, lineHeight: 1.5 }}>{p}</span>
          </li>
        ))}
      </ul>

      <button onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          color: hov ? C.purpleLight : C.muted,
          fontWeight: 700, fontSize: 14,
          transition: "color 0.2s",
        }}
        onMouseEnter={e => e.target.style.textDecoration = "underline"}
        onMouseLeave={e => e.target.style.textDecoration = "none"}
      >{s.cta}</button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TEAM
══════════════════════════════════════════════ */
const TEAM = [
  {
    name: "Vinothkumar Sanjeevi",
    role: "CEO & Founder",
    img: vinoth,
    emoji: "👨‍💼",
    initials: "VS",
    color: C.purple,
    desc: "Visionary founder steering JStudio's mission to deliver world-class digital solutions. Drives business growth, client relationships, and strategic expansion across South Asia.",
    skills: ["Business Strategy", "React", "Leadership"],
    email: "vinodjayasudha@gmail.com",
    linkedin: "#",
  },
  {
    name: "Arunkumar",
    role: "Co-Founder & Marketing Head",
    img: arun,
    emoji: "🎯",
    initials: "AK",
    color: C.blue,
    desc: "Co-founder and marketing strategist driving JStudio's brand growth. Expert in digital marketing, client acquisition, and building strategic partnerships.",
    skills: ["Digital Marketing", "SEO", "Brand Strategy"],
    email: "arun@jstudio.in",
    linkedin: "#",
  },
  {
    name: "John",
    role: "Lead Developer",
    img: john,
   
    initials: "JN",
    color: C.cyan,
    desc: "Full-stack architect building scalable applications with React, TypeScript, and Node.js. Leads technical implementation across all development projects.",
    skills: ["Node.js", "TypeScript", "MySQL"],
    email: "john@jstudio.in",
    linkedin: "#",
  },
];

function Team() {
  const secRef = useGSAPReveal(".team-card", { y: 60, stagger: 0.15, cols: 3 });

  useEffect(() => {
    loadGSAP(() => {
      window.gsap.fromTo(".team-heading", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".team-heading", start: "top 85%" } });
    });
  }, []);

  return (
    <section id="team" ref={secRef} style={{
      padding: "120px 5%", position: "relative", overflow: "hidden",
      background: `radial-gradient(ellipse 100% 60% at 50% 50%, rgba(37,99,235,0.05) 0%, transparent 70%), ${C.darkBg}`,
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="team-heading" style={{ textAlign: "center", marginBottom: 70 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.12)", border: `1px solid ${C.borderBlue}`, borderRadius: 50, padding: "6px 20px", marginBottom: 18 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.blueLight, fontWeight: 700, letterSpacing: 2 }}>THE TEAM</span>
          </div>
          <h2 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: 14 }}>
            Meet the <span style={{ background: `linear-gradient(90deg, ${C.blueLight}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Minds Behind</span> JStudio
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
            The people who turn your ideas into stunning digital reality.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
          {TEAM.map((m, i) => <TeamCard key={i} m={m} />)}
        </div>
      </div>
    </section>
  );
}

function TeamCard({ m }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="team-card"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: C.cardBg,
        border: `1px solid ${hov ? m.color + "60" : C.border}`,
        borderRadius: 20, padding: "36px 30px", textAlign: "center",
        maxWidth: 320, width: "100%",
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        transform: hov ? "translateY(-10px)" : "translateY(0)",
        boxShadow: hov ? `0 24px 60px rgba(0,0,0,0.4), 0 0 30px ${m.color}25` : "none",
      }}>
      {/* Avatar */}
 {/* Avatar */}
<div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 20px" }}>
  <div style={{
    width: 110,
    height: 110,
    borderRadius: "50%",
    border: `3px solid ${m.color}60`,
    overflow: "hidden",
    boxShadow: hov ? `0 0 50px ${m.color}55` : `0 0 30px ${m.color}35`,
    transition: "box-shadow 0.3s",
  }}>
    <img
      src={m.img}
      alt={m.name}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  </div>

  {/* Role dot */}
  <div style={{
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: m.color,
    border: `3px solid ${C.cardBg}`,
    boxShadow: `0 0 10px ${m.color}`,
  }} />
</div>

      <h3 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 18, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>{m.name}</h3>
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: m.color, fontWeight: 700, fontSize: 13, marginBottom: 16, letterSpacing: 0.5 }}>{m.role}</div>
      <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 13.5, lineHeight: 1.7, marginBottom: 20 }}>{m.desc}</p>

      {/* Skills */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {m.skills.map((sk, j) => (
          <span key={j} style={{
            background: `${m.color}15`, border: `1px solid ${m.color}35`,
            color: m.color, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
            padding: "4px 10px", borderRadius: 50,
            fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}>{sk}</span>
        ))}
      </div>

      {/* Social */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        {[
          { ic: "in", href: m.linkedin, label: "LinkedIn" },
          { ic: "✉", href: `mailto:${m.email}`, label: "Email" },
        ].map((b, j) => (
          <a key={j} href={b.href} title={b.label} style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `${m.color}15`, border: `1px solid ${m.color}35`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: m.color, textDecoration: "none",
            fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 13,
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = m.color; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${m.color}15`; e.currentTarget.style.color = m.color; }}
          >{b.ic}</a>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PORTFOLIO
══════════════════════════════════════════════ */
const PORTFOLIO = [
  { em: "🦷", title: "Gentle Dental", tag: "Healthcare Website", desc: "Pixel-perfect dental clinic site with reviews slider, locations slider, FAQ accordion and swipe support.", color: "#06b6d4" },
  { em: "⚡", title: "EMMVEE / ETPL", tag: "Three.js Hero", desc: "Scroll-driven particle morphing between three states — arc, fibonacci sphere, and gold gradient sphere.", color: C.purple },
  { em: "💍", title: "Wedding Invitation", tag: "Digital Invite", desc: "Cinematic Hindu wedding invitation with music player, Om symbol, and autoplay overlay handling.", color: "#ec4899" },
  { em: "🏢", title: "JStudio Agency", tag: "Agency Site", desc: "Full dark-themed business website with Three.js animated hero and EmailJS-integrated quote form.", color: C.blue },
  { em: "🔐", title: "RBAC Application", tag: "Web App", desc: "Role-based access control system with admin dashboard, user management, and secure auth flows.", color: "#8b5cf6" },
  { em: "📊", title: "CRM System", tag: "Business Tool", desc: "Custom CRM with lead management, task tracking, PDF export, and team workflows for a Canada-based client.", color: "#f59e0b" },
];

function Portfolio() {
  const secRef = useGSAPReveal(".port-card", { y: 60, stagger: 0.1, cols: 3 });

  return (
    <section id="portfolio" ref={secRef} style={{
      padding: "120px 5%", position: "relative", overflow: "hidden",
      background: C.black,
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <div style={{ display: "inline-block", background: "rgba(124,58,237,0.12)", border: `1px solid ${C.border}`, borderRadius: 50, padding: "6px 20px", marginBottom: 18 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.purpleLight, fontWeight: 700, letterSpacing: 2 }}>OUR WORK</span>
          </div>
          <h2 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: 14 }}>
            Featured <span style={{ background: grad(), WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Projects</span>
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 16, maxWidth: 480, margin: "0 auto" }}>Real projects. Real results. Production-ready code.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 22 }}>
          {PORTFOLIO.map((p, i) => (
            <div key={i} className="port-card"
              style={{
                background: C.cardBg, borderRadius: 16, overflow: "hidden",
                border: `1px solid ${C.border}`, transition: "all 0.35s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = `0 24px 60px rgba(0,0,0,0.5), 0 0 20px ${p.color}30`; e.currentTarget.style.borderColor = p.color + "60"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.border; }}
            >
              <div style={{
                height: 160, display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(135deg, ${p.color}15, ${p.color}05)`,
                borderBottom: `1px solid ${C.border}`,
                fontSize: 64, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${p.color}12, transparent 70%)` }} />
                <span style={{ position: "relative" }}>{p.em}</span>
              </div>
              <div style={{ padding: "24px 22px" }}>
                <span style={{ background: `${p.color}18`, border: `1px solid ${p.color}35`, color: p.color, fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: "3px 10px", borderRadius: 50, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{p.tag}</span>
                <h3 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", margin: "12px 0 8px" }}>{p.title}</h3>
                <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 13.5, lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════ */
const TESTI = [
  { name: "Ramesh K.", role: "Gym Owner, Aranthangi", text: "JStudio built our gym website in just 5 days. Fast, clean, and our customers love it. They knew exactly what we needed for a small local business. Highly recommend!", rating: 5 },
  { name: "Priya S.", role: "Salon Owner, Tamil Nadu", text: "We needed a booking system and Vinod delivered exactly that. The design is beautiful and works perfectly. Great communication throughout the entire project.", rating: 5 },
  { name: "Karthik M.", role: "Tuition Center, Pudukkottai", text: "JStudio built our student portal with login and role management. Excellent quality work and always available for support. Very satisfied with the final product.", rating: 5 },
];

function Testimonials() {
  const secRef = useGSAPReveal(".testi-card", { y: 50, stagger: 0.15, cols: 3 });

  return (
    <section id="testimonials" ref={secRef} style={{
      padding: "120px 5%", position: "relative", overflow: "hidden",
      background: `radial-gradient(ellipse 100% 60% at 50% 50%, rgba(124,58,237,0.06), transparent 70%), ${C.darkBg}`,
    }}>
      <MiniCanvas id={1} />
      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <div style={{ display: "inline-block", background: "rgba(124,58,237,0.12)", border: `1px solid ${C.border}`, borderRadius: 50, padding: "6px 20px", marginBottom: 18 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.purpleLight, fontWeight: 700, letterSpacing: 2 }}>TESTIMONIALS</span>
          </div>
          <h2 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: 14 }}>
            Our Trusted <span style={{ background: grad(), WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Clients</span>
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 16, maxWidth: 480, margin: "0 auto" }}>Discover what our clients say about their experience working with JStudio.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {TESTI.map((t, i) => (
            <div key={i} className="testi-card" style={{
              background: C.cardBg, borderRadius: 16, padding: "32px 28px",
              border: `1px solid ${C.border}`, transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.4), 0 0 20px ${C.glow}`; e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.border; }}
            >
              <div style={{ fontSize: 32, color: C.purple, marginBottom: 14, opacity: 0.6 }}>❝</div>
              <div style={{ marginBottom: 14 }}>
                {Array(t.rating).fill(0).map((_, j) => <span key={j} style={{ color: "#f59e0b", fontSize: 15 }}>★</span>)}
              </div>
              <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.text, fontSize: 14.5, lineHeight: 1.8, marginBottom: 24, fontStyle: "italic" }}>{t.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: grad(),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: 17,
                  fontFamily: "'Clash Display',sans-serif",
                  boxShadow: `0 0 16px ${C.glow}`,
                }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 600, fontSize: 15, color: "#fff" }}>{t.name}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 12 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   CONTACT
══════════════════════════════════════════════ */
function Contact() {
  const [form, setForm] = useState({ fn: "", ln: "", email: "", phone: "", company: "", service: "", msg: "" });
  const [sent, setSent] = useState(false);
  const secRef = useRef(null);

  useEffect(() => {
    loadGSAP(() => {
      window.gsap.fromTo(".contact-form", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".contact-form", start: "top 85%" } });
      window.gsap.fromTo(".contact-info", { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".contact-info", start: "top 85%" } });
    });
  }, []);

  const svcs = ["Web Development", "E-Commerce Site", "Logo & Banner Design", "SaaS Platform", "CRM / Internal Tools", "Support & Fixes", "Other"];

  const inp = {
    width: "100%", border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "12px 16px", fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif",
    background: "rgba(255,255,255,0.04)", color: "#fff", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const fo = e => { e.target.style.borderColor = C.purpleLight; e.target.style.boxShadow = `0 0 0 3px rgba(124,58,237,0.15)`; };
  const bl = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; };

  const send = () => {
    if (!form.fn || !form.email || !form.msg) return;
    const sub = encodeURIComponent(`JStudio Inquiry — ${form.service || "General"} from ${form.fn}`);
    const body = encodeURIComponent(`Name: ${form.fn} ${form.ln}\nEmail: ${form.email}\nPhone: ${form.phone}\nCompany: ${form.company}\nService: ${form.service}\n\nMessage:\n${form.msg}`);
    window.location.href = `mailto:vinodjayasudha@gmail.com?subject=${sub}&body=${body}`;
    setSent(true);
  };

  const INFO = [
    { ic: "📍", lb: "Office Location", ls: ["Aranthangi, Tamil Nadu, India", "Serving clients worldwide"] },
    { ic: "📞", lb: "Phone Number", ls: ["+91 93803 34317 (India)"] },
    { ic: "✉️", lb: "Email Address", ls: ["vinodjayasudha@gmail.com"] },
    { ic: "🕐", lb: "Business Hours", ls: ["Mon – Fri: 9:00 AM – 6:00 PM", "Weekends: On request"] },
  ];

  return (
    <section id="contact" ref={secRef} style={{
      padding: "120px 5%", position: "relative", overflow: "hidden",
      background: `linear-gradient(180deg, ${C.black} 0%, ${C.darkBg} 100%)`,
    }}>
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, rgba(124,58,237,0.06), transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <div style={{ display: "inline-block", background: "rgba(124,58,237,0.12)", border: `1px solid ${C.border}`, borderRadius: 50, padding: "6px 20px", marginBottom: 18 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.purpleLight, fontWeight: 700, letterSpacing: 2 }}>CONTACT US</span>
          </div>
          <h2 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: 14 }}>
            Let's Start Your{" "}
            <span style={{ background: grad(), WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Success Story</span>
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 16, maxWidth: 480, margin: "0 auto", lineHeight: 1.75 }}>
            Ready to transform your digital presence? Contact us today for a free consultation.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }} className="cont-grid">

          {/* FORM */}
          <div className="contact-form" style={{
            background: C.cardBg, borderRadius: 20, padding: "40px",
            border: `1px solid ${C.border}`,
            boxShadow: `0 0 40px rgba(124,58,237,0.08)`,
          }}>
            <h3 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 28, display: "flex", alignItems: "center", gap: 10 }}>
              <span>📩</span> Send Us a Message
            </h3>
            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: "'Clash Display',sans-serif", color: "#fff", marginBottom: 10 }}>Message Sent!</h3>
                <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, marginBottom: 20 }}>We'll get back to you within 12 hours.</p>
                <button onClick={() => setSent(false)} style={{
                  background: grad(), color: "#fff", border: "none",
                  padding: "12px 28px", borderRadius: 10, cursor: "pointer",
                  fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14,
                  boxShadow: `0 0 20px ${C.glow}`,
                }}>Send Another</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>FIRST NAME *</label>
                    <input placeholder="Vinoth" value={form.fn} onChange={e => setForm({ ...form, fn: e.target.value })} style={inp} onFocus={fo} onBlur={bl} />
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>LAST NAME</label>
                    <input placeholder="S." value={form.ln} onChange={e => setForm({ ...form, ln: e.target.value })} style={inp} onFocus={fo} onBlur={bl} />
                  </div>
                </div>
                {[
                  { lb: "EMAIL *", ph: "your@email.com", k: "email" },
                  { lb: "PHONE NUMBER", ph: "+91 9XXXXXXXXX", k: "phone" },
                  { lb: "COMPANY", ph: "Company Name (optional)", k: "company" },
                ].map(f => (
                  <div key={f.k}>
                    <label style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>{f.lb}</label>
                    <input placeholder={f.ph} value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} style={inp} onFocus={fo} onBlur={bl} />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>SERVICE REQUIRED</label>
                  <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} style={{ ...inp, cursor: "pointer" }} onFocus={fo} onBlur={bl}>
                    <option value="" style={{ background: C.cardBg }}>Select a service...</option>
                    {svcs.map(s => <option key={s} value={s} style={{ background: C.cardBg }}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>MESSAGE *</label>
                  <textarea placeholder="Tell us about your project and how we can help." rows={4} value={form.msg} onChange={e => setForm({ ...form, msg: e.target.value })} style={{ ...inp, resize: "vertical" }} onFocus={fo} onBlur={bl} />
                </div>
                <button onClick={send} style={{
                  background: grad(), color: "#fff", border: "none", cursor: "pointer",
                  padding: "15px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15,
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  boxShadow: `0 0 30px ${C.glow}`,
                  transition: "all 0.25s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 10px 40px rgba(124,58,237,0.5)`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 0 30px ${C.glow}`; }}
                >Send Message 🚀</button>
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="contact-info">
            <h3 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 24 }}>Get in Touch</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
              {INFO.map((info, i) => (
                <div key={i} style={{
                  background: C.cardBg, borderRadius: 14, padding: "18px 20px",
                  border: `1px solid ${C.border}`, display: "flex", gap: 16, alignItems: "flex-start",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; e.currentTarget.style.transform = "translateX(6px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateX(0)"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: grad(), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 0 16px ${C.glow}` }}>{info.ic}</div>
                  <div>
                    <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 600, fontSize: 14, color: "#fff", marginBottom: 4 }}>{info.lb}</div>
                    {info.ls.map((l, j) => <div key={j} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 13.5 }}>{l}</div>)}
                  </div>
                </div>
              ))}
            </div>

            {/* Map box */}
            <div style={{
              borderRadius: 16, border: `1px solid ${C.border}`, height: 180,
              background: `linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.08))`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: `inset 0 0 40px rgba(124,58,237,0.05)`,
            }}>
              <div style={{ fontSize: 40 }}>🗺️</div>
              <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 600, color: "#fff", fontSize: 15 }}>Aranthangi, Tamil Nadu</div>
              <a href="https://maps.google.com/?q=Aranthangi,Tamil+Nadu" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.purpleLight, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                Open in Maps →
              </a>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.cont-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}

/* ══════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════ */
const SOCIAL = [
  { ic: "f", name: "Facebook",  href: "https://facebook.com",  color: "#1877f2" },
  { ic: "in", name: "LinkedIn",  href: "https://linkedin.com",  color: "#0a66c2" },
  { ic: "tw", name: "Twitter",   href: "https://twitter.com",   color: "#1da1f2" },
  { ic: "ig", name: "Instagram", href: "https://instagram.com", color: "#e1306c" },
  { ic: "yt", name: "YouTube",   href: "https://youtube.com",   color: "#ff0000" },
  { ic: "wa", name: "WhatsApp",  href: "https://wa.me/919380334317", color: "#25d366" },
];

const SOCIAL_ICONS = {
  f:  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  in: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  tw: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  ig: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  yt: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  wa: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
};

function Footer() {
  const yr = new Date().getFullYear();

  return (
    <footer style={{ background: "#03030d", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 5% 36px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", gap: 52, marginBottom: 60 }} className="fgrid">

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: grad(), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Clash Display',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff", boxShadow: `0 0 20px ${C.glow}` }}>JS</div>
              <div>
                <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", letterSpacing: 1 }}>JStudio</div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2 }}>FULL-STACK WEB & APP DEVELOPMENT</div>
              </div>
            </div>
            <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 14, lineHeight: 1.8, marginBottom: 22 }}>
              Full-stack web applications, SaaS platforms, CRM systems, and digital apps — built for startups and businesses across India and worldwide.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[
                { ic: "✉", v: "vinodjayasudha@gmail.com", h: "mailto:vinodjayasudha@gmail.com" },
                { ic: "📞", v: "+91 93803 34317", h: "tel:9380334317" },
                { ic: "📍", v: "Aranthangi, Tamil Nadu, IN", h: null },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.purpleLight, fontSize: 15 }}>{c.ic}</span>
                  {c.h
                    ? <a href={c.h} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, textDecoration: "none", fontSize: 13.5, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = C.purpleLight} onMouseLeave={e => e.target.style.color = C.muted}>{c.v}</a>
                    : <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 13.5 }}>{c.v}</span>
                  }
                </div>
              ))}
            </div>

            {/* Social Media Icons */}
            <div>
              <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 600, fontSize: 14, color: "#fff", marginBottom: 14, letterSpacing: 0.5 }}>Follow Us</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {SOCIAL.map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" title={s.name} style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.muted, textDecoration: "none",
                    transition: "all 0.25s",
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = s.color + "22";
                      e.currentTarget.style.borderColor = s.color + "60";
                      e.currentTarget.style.color = s.color;
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = `0 6px 20px ${s.color}30`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.color = C.muted;
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {SOCIAL_ICONS[s.ic]}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontFamily: "'Clash Display',sans-serif", color: "#fff", fontWeight: 600, fontSize: 16, marginBottom: 22, letterSpacing: 0.5 }}>Company</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["About JStudio", "Our Services", "Portfolio", "Team", "Contact"].map(l => (
                <a key={l} href="#" onClick={e => e.preventDefault()} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = C.purpleLight}
                  onMouseLeave={e => e.target.style.color = C.muted}
                >{l}</a>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 style={{ fontFamily: "'Clash Display',sans-serif", color: "#fff", fontWeight: 600, fontSize: 16, marginBottom: 22, letterSpacing: 0.5 }}>Resources</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Request a Quote", "View Our Work", "Client Reviews", "Privacy Policy", "Terms of Service"].map(l => (
                <a key={l} href="#" onClick={e => e.preventDefault()} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = C.purpleLight}
                  onMouseLeave={e => e.target.style.color = C.muted}
                >{l}</a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{ fontFamily: "'Clash Display',sans-serif", color: "#fff", fontWeight: 600, fontSize: 16, marginBottom: 12, letterSpacing: 0.5 }}>Stay Updated</h4>
            <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 13.5, lineHeight: 1.75, marginBottom: 16 }}>Subscribe for our latest digital marketing insights and tips.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Enter your email" style={{
                border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "12px 16px", fontSize: 14,
                background: "rgba(255,255,255,0.04)", color: "#fff",
                fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none",
                transition: "border-color 0.2s",
              }}
                onFocus={e => e.target.style.borderColor = C.purpleLight}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button style={{
                background: grad(), color: "#fff", border: "none", cursor: "pointer",
                padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                boxShadow: `0 0 20px ${C.glow}`, transition: "opacity 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >Subscribe →</button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: `1px solid ${C.border}`, paddingTop: 28,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, fontSize: 13 }}>
            © {yr} JStudio. All rights reserved. • Made with ❤️ by the JStudio Team
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
              <a key={l} href="#" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.muted, textDecoration: "none", fontSize: 12, transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = C.purpleLight}
                onMouseLeave={e => e.target.style.color = C.muted}
              >{l}</a>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media(max-width:900px){.fgrid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:560px){.fgrid{grid-template-columns:1fr!important}}
      `}</style>
    </footer>
  );
}

/* ══════════════════════════════════════════════
   APP
══════════════════════════════════════════════ */
export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: ${C.black};
          color: ${C.text};
          overflow-x: hidden;
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${C.black}; }
        ::-webkit-scrollbar-thumb { background: ${C.purple}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.purpleLight}; }
        ::selection { background: rgba(124,58,237,0.35); color: #fff; }

        /* Custom cursor glow */
        * { cursor: none !important; }
        #cursor {
          position: fixed; width: 12px; height: 12px; border-radius: 50%;
          background: ${C.purpleLight}; pointer-events: none; z-index: 9999;
          transform: translate(-50%, -50%);
          transition: width 0.2s, height 0.2s, opacity 0.2s;
          mix-blend-mode: screen;
        }
        #cursor-ring {
          position: fixed; width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(168,85,247,0.5); pointer-events: none; z-index: 9998;
          transform: translate(-50%, -50%);
          transition: all 0.12s ease-out;
        }

        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes bpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }
        @keyframes orb-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }

        /* Glow text utility */
        .glow-text { text-shadow: 0 0 30px rgba(124,58,237,0.5); }

        @media(max-width:768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-visual { display: none !important; }
        }
      `}</style>

      {/* Custom cursor */}
      <CursorGlow />

      <Navbar />
      <Hero />
      <Services />
      <Team />
      <Portfolio />
      <Testimonials />
      <Contact />
      <Footer />
    </>
  );
}

/* Custom cursor component */
function CursorGlow() {
  useEffect(() => {
    const cursor = document.getElementById("cursor");
    const ring = document.getElementById("cursor-ring");
    if (!cursor || !ring) return;

    let rx = 0, ry = 0;
    const move = e => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
      // Ring follows with slight lag
      setTimeout(() => {
        if (ring) { ring.style.left = e.clientX + "px"; ring.style.top = e.clientY + "px"; }
      }, 60);
    };
    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, []);

  return (
    <>
      <div id="cursor" />
      <div id="cursor-ring" />
    </>
  );
}