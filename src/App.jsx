import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const C = {
  orange: "#f97316", orangeLight: "#fb923c", orangeDark: "#ea580c",
  teal: "#0d9488", dark: "#111827", cream: "#fdf8f3", creamDeep: "#f5ede0",
  card: "#ffffff", muted: "#6b7280", border: "#e5e7eb", text: "#1f2937",
};

/* ═══ THREE.JS HERO CANVAS ═══ */
function HeroCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 7);

    const orbData = [
      { r: 1.1, x: 2.2, y: 0.3, z: -1, color: C.orange, speed: 0.8 },
      { r: 0.65, x: -2.0, y: -1.0, z: 0, color: "#f59e0b", speed: 1.1 },
      { r: 0.45, x: 1.2, y: -1.8, z: 0.5, color: C.teal, speed: 0.6 },
      { r: 0.3, x: -1.0, y: 1.5, z: 0.2, color: C.orangeLight, speed: 1.4 },
      { r: 0.55, x: 0.2, y: 2.0, z: -0.5, color: "#fbbf24", speed: 0.9 },
    ];
    const orbs = orbData.map(d => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(d.r, 32, 32),
        new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.18 })
      );
      mesh.position.set(d.x, d.y, d.z);
      mesh.userData = { ox: d.x, oy: d.y, speed: d.speed };
      scene.add(mesh); return mesh;
    });

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.8, 0.012, 12, 100),
      new THREE.MeshBasicMaterial({ color: C.orange, transparent: true, opacity: 0.3 })
    );
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.008, 12, 100),
      new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.2 })
    );
    ring2.rotation.x = -Math.PI / 4; ring2.rotation.y = Math.PI / 5;
    scene.add(ring2);

    const pCount = 600, pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: C.orange, size: 0.025, transparent: true, opacity: 0.35 }));
    scene.add(pts);

    let mx = 0, my = 0;
    const onMM = e => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; };
    window.addEventListener("mousemove", onMM);

    let t = 0, raf;
    const animate = () => {
      t += 0.012;
      ring.rotation.z = t * 0.15; ring2.rotation.z = -t * 0.1;
      pts.rotation.y = t * 0.04 + mx * 0.05; pts.rotation.x = t * 0.02 + my * 0.03;
      orbs.forEach(o => {
        o.position.y = o.userData.oy + Math.sin(t * o.userData.speed) * 0.3;
        o.position.x = o.userData.ox + Math.cos(t * o.userData.speed * 0.7) * 0.15;
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => { const W2 = el.clientWidth, H2 = el.clientHeight; camera.aspect = W2 / H2; camera.updateProjectionMatrix(); renderer.setSize(W2, H2); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMM); window.removeEventListener("resize", onResize); renderer.dispose(); if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, []);
  return <div ref={ref} style={{ position: "absolute", inset: 0, zIndex: 0 }} />;
}

/* ═══ GSAP LOADER ═══ */
function useGSAP() {
  useEffect(() => {
    if (window._gsapLoaded) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    s.onload = () => {
      const s2 = document.createElement("script");
      s2.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";
      s2.onload = () => {
        window.gsap.registerPlugin(window.ScrollTrigger);
        window._gsapLoaded = true;
        document.querySelectorAll(".gfu").forEach((el, i) => {
          window.gsap.fromTo(el,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.7, delay: (i % 3) * 0.1,
              scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" } }
          );
        });
      };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  }, []);
}

/* ═══ NAVBAR ═══ */
const NAV_LINKS = ["Home", "Services", "Team", "Portfolio", "Testimonials", "Contact"];
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const go = id => { document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" }); setOpen(false); };

  return (
    <>
      <div style={{ background: C.dark, height: 4, position: "fixed", top: 0, left: 0, right: 0, zIndex: 1001 }} />
      <nav style={{
        position: "fixed", top: 4, left: 0, right: 0, zIndex: 1000,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.08)" : "none",
        transition: "box-shadow 0.3s",
        padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: 14, fontFamily: "'Syne',sans-serif",
            boxShadow: `0 4px 12px rgba(249,115,22,0.35)`,
          }}>JS</div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: C.dark }}>JStudio</div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>Your Digital Partner</div>
          </div>
        </div>

        <div className="nlinks" style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {NAV_LINKS.map(l => (
            <button key={l} onClick={() => go(l)}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: C.dark, fontSize: 14, fontWeight: 600, padding: 0, transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = C.orange}
              onMouseLeave={e => e.target.style.color = C.dark}
            >{l}</button>
          ))}
        </div>

        <div className="nbtns" style={{ display: "flex", gap: 10 }}>
          <a href="mailto:vinodjayasudha@gmail.com" style={{
            border: `2px solid ${C.orange}`, color: C.orange, padding: "8px 18px",
            borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13, transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = C.orange; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.orange; }}
          >Internships</a>
          <a href="tel:9380334317" style={{
            background: C.orange, color: "#fff", padding: "8px 18px",
            borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13,
            boxShadow: `0 4px 14px rgba(249,115,22,0.3)`, transition: "transform 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >Hire Us</a>
        </div>

        <button onClick={() => setOpen(!open)} className="hbg"
          style={{ display: "none", background: "none", border: "none", fontSize: 24, cursor: "pointer", color: C.dark }}>
          {open ? "✕" : "☰"}
        </button>

        {open && (
          <div style={{
            position: "fixed", top: 72, left: 0, right: 0, background: "#fff",
            borderBottom: `1px solid ${C.border}`, padding: "20px 5%",
            display: "flex", flexDirection: "column", gap: 16, zIndex: 999,
          }}>
            {NAV_LINKS.map(l => (
              <button key={l} onClick={() => go(l)}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: C.dark, fontSize: 16, fontWeight: 700, textAlign: "left" }}
              >{l}</button>
            ))}
            <a href="tel:9380334317" style={{ background: C.orange, color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 700, textAlign: "center" }}>Hire Us</a>
          </div>
        )}
      </nav>
      <style>{`
        @media(max-width:900px){.nlinks{display:none!important}.nbtns{display:none!important}.hbg{display:block!important}}
      `}</style>
    </>
  );
}

/* ═══ HERO ═══ */
function Hero() {
  const txtRef = useRef(null);
  useEffect(() => {
    if (!txtRef.current) return;
    txtRef.current.style.opacity = "0"; txtRef.current.style.transform = "translateX(-40px)";
    setTimeout(() => {
      if (!txtRef.current) return;
      txtRef.current.style.transition = "all 1s cubic-bezier(0.22,1,0.36,1)";
      txtRef.current.style.opacity = "1"; txtRef.current.style.transform = "translateX(0)";
    }, 300);
  }, []);

  const stats = [{ n: "50+", l: "Projects Delivered" }, { n: "10+", l: "Happy Clients" }, { n: "5+", l: "Service Categories" }, { n: "24/7", l: "Support" }];

  return (
    <section id="home" style={{
      position: "relative", minHeight: "100vh", paddingTop: 72,
      background: `linear-gradient(135deg, ${C.cream} 0%, #fff5eb 60%, ${C.cream} 100%)`,
      display: "flex", alignItems: "center", overflow: "hidden",
    }}>
      <HeroCanvas />
      <div style={{ position: "absolute", top: "15%", right: "6%", width: 200, height: 200, borderRadius: "40% 60% 55% 45%/50% 45% 55% 50%", background: C.orange, opacity: 0.1, zIndex: 1, pointerEvents: "none", animation: "bf 7s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "12%", right: "20%", width: 130, height: 130, borderRadius: "50%", background: C.teal, opacity: 0.12, zIndex: 1, pointerEvents: "none", animation: "bf 9s ease-in-out infinite reverse" }} />

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 5%", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", position: "relative", zIndex: 2 }} className="hgrid">
        <div ref={txtRef}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 50, padding: "6px 16px", marginBottom: 24 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.orange, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, color: C.orange, fontWeight: 700, letterSpacing: 1 }}>DESIGN · DEVELOP · GROW</span>
          </div>

          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(2rem,5vw,3.6rem)", fontWeight: 900, color: C.dark, lineHeight: 1.1, margin: "0 0 16px" }}>
            Build Your Business<br />with <span style={{ color: C.orange }}>Proven Digital</span><br /><span style={{ color: C.orange }}>Solutions</span>
          </h1>

          <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.8, maxWidth: 520, marginBottom: 36 }}>
            We build stunning websites, web applications, SaaS platforms, CRM systems, and full digital marketing solutions — for startups, businesses, and clients across India and worldwide. Production-ready. Real results. Transparent process.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 52 }}>
            <a href="#services" onClick={e => { e.preventDefault(); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ background: C.orange, color: "#fff", padding: "13px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15, boxShadow: `0 6px 20px rgba(249,115,22,0.35)`, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 10px 28px rgba(249,115,22,0.45)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 6px 20px rgba(249,115,22,0.35)`; }}
            >Explore Services →</a>
            <a href="#contact" onClick={e => { e.preventDefault(); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ border: `2px solid ${C.dark}`, color: C.dark, padding: "13px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.dark; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.dark; }}
            >Get Free Quote</a>
          </div>

          <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
            {stats.map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 900, color: C.orange }}>{s.n}</div>
                <div style={{ color: C.muted, fontSize: 13 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right visual */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 300, height: 300, borderRadius: "60% 40% 55% 45%/45% 55% 45% 55%", background: `linear-gradient(135deg,rgba(249,115,22,0.12),rgba(249,115,22,0.04))`, border: `2px solid rgba(249,115,22,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", animation: "bf 7s ease-in-out infinite" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 60, marginBottom: 10 }}>🚀</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: C.dark }}>JStudio</div>
              <div style={{ color: C.orange, fontWeight: 700, fontSize: 13 }}>Digital Solutions</div>
            </div>
            {[
              { ic: "🌐", lb: "Web Dev", t: "-18%", l: "-16%", d: "0s" },
              { ic: "🎨", lb: "Design", t: "-18%", r: "-16%", d: "0.5s" },
              { ic: "📱", lb: "Apps", b: "-12%", l: "8%", d: "1s" },
              { ic: "⚙️", lb: "SaaS", b: "-4%", r: "-14%", d: "1.5s" },
            ].map((b, i) => (
              <div key={i} style={{
                position: "absolute",
                ...(b.t && { top: b.t }), ...(b.b && { bottom: b.b }),
                ...(b.l && { left: b.l }), ...(b.r && { right: b.r }),
                background: "#fff", borderRadius: 12, padding: "9px 13px",
                display: "flex", alignItems: "center", gap: 7,
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)", border: `1px solid ${C.border}`,
                animation: `bf ${5 + i}s ease-in-out infinite`, animationDelay: b.d,
                whiteSpace: "nowrap", zIndex: 2,
              }}>
                <span style={{ fontSize: 17 }}>{b.ic}</span>
                <span style={{ fontWeight: 700, fontSize: 12, color: C.dark }}>{b.lb}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bf { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(2deg)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @media(max-width:768px){.hgrid{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  );
}

/* ═══ SERVICES ═══ */
const SVCS = [
  { ic: "🌐", title: "Custom Web Development", sub: "From Idea to Live Product", featured: false,
    desc: "We build full-stack websites and web apps with React, PHP, Node.js, and MySQL — fast, secure, and built to scale.",
    pts: ["React / Next.js frontends", "PHP + MySQL / Node.js backends", "REST API design & integration", "Admin dashboards & portals", "Authentication & role management"],
    cta: "Start Your Project →" },
  { ic: "🛒", title: "Business & E-Commerce Sites", sub: "Sites That Convert", featured: true,
    desc: "Professional websites built with speed, SEO, and a clear call to action — not just a pretty template.",
    pts: ["Corporate & portfolio sites", "Online stores with payment gateway", "Product & service landing pages", "Booking & enquiry systems", "SEO-ready structure from day one"],
    cta: "Get a Free Quote →" },
  { ic: "🖼️", title: "Logo & Banner Design", sub: "Your Brand, Perfected", featured: false,
    desc: "Eye-catching logos, banners, and brand identity that make your business unforgettable.",
    pts: ["Logo & brand identity", "Social media banners & ads", "Digital marketing creatives", "Business card & stationery", "Brand guideline document"],
    cta: "Design My Brand →" },
  { ic: "🗄️", title: "SaaS & Platform Development", sub: "Multi-Tenant Platforms", featured: false,
    desc: "Subscription systems, client portals, and platforms built for real usage at scale.",
    pts: ["Subscription & billing systems", "Multi-user portals with roles", "Real-time messaging & notifications", "File uploads, reports & exports", "Stripe / Razorpay integration"],
    cta: "Build My Platform →" },
  { ic: "📋", title: "CRM & Internal Tools", sub: "Replace Spreadsheets", featured: true,
    desc: "Custom business software that automates your operations and replaces manual work.",
    pts: ["Client & lead management", "Document generation & PDF export", "Task tracking & team workflows", "Custom reports & dashboards", "Fully private, hosted on your server"],
    cta: "Automate My Business →" },
  { ic: "🛡️", title: "Support, Fixes & Upgrades", sub: "Fast Turnaround", featured: false,
    desc: "Already have a site or app that needs help? We fix bugs, improve performance, and add features fast.",
    pts: ["Bug fixes & emergency patches", "Speed & performance optimization", "Feature additions to existing apps", "Security hardening & updates", "12-hour response SLA via email"],
    cta: "Fix My Project →" },
];

function Services() {
  useGSAP();
  return (
    <section id="services" style={{ padding: "100px 5%", background: C.cream }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <span style={{ background: "rgba(249,115,22,0.1)", color: C.orange, fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: "5px 16px", borderRadius: 50 }}>OUR SERVICES</span>
        </div>
        <h2 className="gfu" style={{ fontFamily: "'Syne',sans-serif", textAlign: "center", fontSize: "clamp(1.6rem,3.5vw,2.6rem)", fontWeight: 800, color: C.dark, marginBottom: 12 }}>What We Deliver</h2>
        <p className="gfu" style={{ textAlign: "center", color: C.muted, fontSize: 15, maxWidth: 560, margin: "0 auto 60px", lineHeight: 1.7 }}>
          No generalist fluff. Just clean, scalable, production-ready digital work — from design to deployment.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 24 }}>
          {SVCS.map((s, i) => <SvcCard key={i} s={s} />)}
        </div>
      </div>
    </section>
  );
}

function SvcCard({ s }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="gfu"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: C.card, borderRadius: 16,
        border: `1px solid ${hov ? C.orange : C.border}`,
        borderTop: `3px solid ${s.featured || hov ? C.orange : C.border}`,
        padding: "32px 28px", transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        transform: hov ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hov ? "0 20px 48px rgba(0,0,0,0.09)" : "0 2px 8px rgba(0,0,0,0.04)",
      }}>
      <div style={{
        width: 50, height: 50, borderRadius: 12, background: C.orange,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, marginBottom: 18, boxShadow: `0 4px 14px rgba(249,115,22,0.28)`,
        transition: "transform 0.3s", transform: hov ? "rotate(-8deg) scale(1.1)" : "rotate(0)",
      }}>{s.ic}</div>
      <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: s.featured ? C.orange : C.dark, margin: "0 0 4px" }}>{s.title}</h3>
      <div style={{ color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 12 }}>{s.sub}</div>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>{s.desc}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px" }}>
        {s.pts.map((p, j) => (
          <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.orange, flexShrink: 0, marginTop: 6 }} />
            <span style={{ color: C.text, fontSize: 13.5, lineHeight: 1.5 }}>{p}</span>
          </li>
        ))}
      </ul>
      <button onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.orange, fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}
        onMouseEnter={e => e.target.style.textDecoration = "underline"}
        onMouseLeave={e => e.target.style.textDecoration = "none"}
      >{s.cta}</button>
    </div>
  );
}

/* ═══ TEAM ═══ */
function Team() {
  return (
    <section id="team" style={{ padding: "100px 5%", background: C.creamDeep }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <h2 className="gfu" style={{ fontFamily: "'Syne',sans-serif", textAlign: "center", fontSize: "clamp(1.6rem,3.5vw,2.6rem)", fontWeight: 800, color: C.dark, marginBottom: 10 }}>Meet the Team</h2>
        <p className="gfu" style={{ textAlign: "center", color: C.muted, fontSize: 15, marginBottom: 60 }}>The people behind JStudio's digital solutions</p>

        <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
          {/* Founder card */}
          <div className="gfu" style={{
            background: C.card, borderRadius: 20, padding: "40px 36px", textAlign: "center", maxWidth: 300, width: "100%",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: `1px solid ${C.border}`, transition: "all 0.3s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.07)"; }}
          >
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: `linear-gradient(135deg,${C.orange},${C.orangeDark})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 30, color: "#fff", fontWeight: 900, fontFamily: "'Syne',sans-serif", boxShadow: `0 6px 20px rgba(249,115,22,0.3)` }}>VJ</div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: C.dark, margin: "0 0 4px" }}>Vinod Jayasudha</h3>
            <div style={{ color: C.orange, fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Founder & Developer</div>
            <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.7, marginBottom: 22 }}>Founder and lead developer of JStudio. Frontend specialist in React, Three.js, GSAP & SCSS. Driving digital solutions for businesses across India and worldwide.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              {[{ ic: "✉", href: "mailto:vinodjayasudha@gmail.com" }, { ic: "📞", href: "tel:9380334317" }].map((b, i) => (
                <a key={i} href={b.href} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: C.orange, textDecoration: "none", fontSize: 16, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.orange; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(249,115,22,0.1)"; e.currentTarget.style.color = C.orange; }}
                >{b.ic}</a>
              ))}
            </div>
          </div>

          {/* Join card */}
          <div className="gfu" style={{ background: `linear-gradient(135deg,rgba(249,115,22,0.06),rgba(249,115,22,0.02))`, border: `2px dashed rgba(249,115,22,0.3)`, borderRadius: 20, padding: "40px 36px", textAlign: "center", maxWidth: 300, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🤝</div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: C.dark, marginBottom: 10 }}>Join Our Team</h3>
            <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.7, marginBottom: 22 }}>We're always looking for talented developers and designers. Let's build something great together.</p>
            <a href="mailto:vinodjayasudha@gmail.com?subject=Join JStudio" style={{ background: C.orange, color: "#fff", padding: "10px 22px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13, boxShadow: `0 4px 14px rgba(249,115,22,0.3)` }}>Get in Touch →</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══ PORTFOLIO ═══ */
const PORTFOLIO = [
  { em: "🦷", title: "Gentle Dental", tag: "Healthcare Website", desc: "Pixel-perfect dental clinic site with reviews slider, locations slider, FAQ accordion and swipe support.", color: "#0ea5e9" },
  { em: "⚡", title: "EMMVEE / ETPL", tag: "Three.js Hero", desc: "Scroll-driven particle morphing between three states — arc, fibonacci sphere, and gold gradient sphere.", color: C.orange },
  { em: "💍", title: "Wedding Invitation", tag: "Digital Invite", desc: "Cinematic Hindu wedding invitation with music player, Om symbol rendering, and autoplay overlay handling.", color: "#ec4899" },
  { em: "🏢", title: "JStudio Website", tag: "Agency Site", desc: "Full dark-themed business website with Three.js animated hero and EmailJS-integrated quote form.", color: C.teal },
  { em: "🔐", title: "RBAC Application", tag: "Web App", desc: "Role-based access control system with admin dashboard, user management, and secure auth flows.", color: "#8b5cf6" },
  { em: "📊", title: "CRM System", tag: "Business Tool", desc: "Custom CRM with lead management, task tracking, PDF export, and team workflows for a Canada-based client.", color: "#f59e0b" },
];

function Portfolio() {
  return (
    <section id="portfolio" style={{ padding: "100px 5%", background: C.cream }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <span style={{ background: "rgba(249,115,22,0.1)", color: C.orange, fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: "5px 16px", borderRadius: 50 }}>OUR WORK</span>
        </div>
        <h2 className="gfu" style={{ fontFamily: "'Syne',sans-serif", textAlign: "center", fontSize: "clamp(1.6rem,3.5vw,2.6rem)", fontWeight: 800, color: C.dark, margin: "14px 0 10px" }}>Featured Projects</h2>
        <p className="gfu" style={{ textAlign: "center", color: C.muted, fontSize: 15, marginBottom: 60 }}>Real projects. Real results. Production-ready code.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 22 }}>
          {PORTFOLIO.map((p, i) => (
            <div key={i} className="gfu" style={{ background: C.card, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, transition: "all 0.3s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 48px rgba(0,0,0,0.1)`; e.currentTarget.style.borderColor = p.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.border; }}
            >
              <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${p.color}15,${p.color}05)`, borderBottom: `1px solid ${C.border}`, fontSize: 60 }}>{p.em}</div>
              <div style={{ padding: "22px 20px" }}>
                <span style={{ background: `${C.orange}18`, color: C.orange, fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: "3px 10px", borderRadius: 50 }}>{p.tag}</span>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: C.dark, margin: "10px 0 8px" }}>{p.title}</h3>
                <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ TESTIMONIALS ═══ */
const TESTI = [
  { name: "Ramesh K.", role: "Gym Owner, Aranthangi", text: "JStudio built our gym website in just 5 days. Fast, clean, and our customers love it. They knew exactly what we needed. Highly recommend!", rating: 5 },
  { name: "Priya S.", role: "Salon Owner, Tamil Nadu", text: "We needed a booking system and Vinod delivered exactly that. The design is beautiful and works perfectly. Great communication throughout.", rating: 5 },
  { name: "Karthik M.", role: "Tuition Center, Pudukkottai", text: "JStudio built our student portal with login and role management. Excellent quality and always available for support. Very satisfied!", rating: 5 },
];

function Testimonials() {
  return (
    <section id="testimonials" style={{ padding: "100px 5%", background: C.creamDeep }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <span style={{ background: "rgba(249,115,22,0.1)", color: C.orange, fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: "5px 16px", borderRadius: 50 }}>TESTIMONIALS</span>
        </div>
        <h2 className="gfu" style={{ fontFamily: "'Syne',sans-serif", textAlign: "center", fontSize: "clamp(1.6rem,3.5vw,2.6rem)", fontWeight: 800, color: C.dark, margin: "14px 0 10px" }}>Our Trusted Clients</h2>
        <p className="gfu" style={{ textAlign: "center", color: C.muted, fontSize: 15, marginBottom: 60 }}>Discover what our clients say about their experience working with JStudio.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 22 }}>
          {TESTI.map((t, i) => (
            <div key={i} className="gfu" style={{ background: C.card, borderRadius: 16, padding: "28px 24px", border: `1px solid ${C.border}`, transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 28, color: C.orange, marginBottom: 10, opacity: 0.4 }}>❝</div>
              <div style={{ marginBottom: 12 }}>{Array(t.rating).fill(0).map((_, j) => <span key={j} style={{ color: C.orange, fontSize: 14 }}>★</span>)}</div>
              <p style={{ color: C.text, fontSize: 14, lineHeight: 1.75, marginBottom: 22, fontStyle: "italic" }}>{t.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${C.orange},${C.orangeDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "'Syne',sans-serif" }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{t.name}</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ CONTACT ═══ */
function Contact() {
  const [form, setForm] = useState({ fn: "", ln: "", email: "", phone: "", company: "", service: "", msg: "" });
  const [sent, setSent] = useState(false);
  const svcs = ["Web Development", "E-Commerce Site", "Logo & Banner Design", "SaaS Platform", "CRM / Internal Tools", "Support & Fixes", "Other"];
  const inp = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", background: "#fff", color: C.dark, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };
  const fo = e => e.target.style.borderColor = C.orange;
  const bl = e => e.target.style.borderColor = C.border;

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
    <section id="contact" style={{ padding: "100px 5%", background: C.cream }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <span style={{ background: "rgba(249,115,22,0.1)", color: C.orange, fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: "5px 16px", borderRadius: 50 }}>CONTACT US</span>
        </div>
        <h2 className="gfu" style={{ fontFamily: "'Syne',sans-serif", textAlign: "center", fontSize: "clamp(1.6rem,3.5vw,2.6rem)", fontWeight: 800, color: C.dark, margin: "14px 0 10px" }}>
          Let's Start Your <span style={{ color: C.orange }}>Success Story</span>
        </h2>
        <p className="gfu" style={{ textAlign: "center", color: C.muted, fontSize: 15, maxWidth: 480, margin: "0 auto 60px", lineHeight: 1.7 }}>
          Ready to transform your digital presence? Contact us today for a free consultation.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }} className="cgrid">
          {/* Form */}
          <div style={{ background: C.card, borderRadius: 20, padding: "40px", border: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: C.dark, marginBottom: 26, display: "flex", alignItems: "center", gap: 8 }}>📩 Send Us a Message</h3>
            {sent ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", color: C.dark, marginBottom: 8 }}>Message Sent!</h3>
                <p style={{ color: C.muted, marginBottom: 18 }}>We'll get back to you within 12 hours.</p>
                <button onClick={() => setSent(false)} style={{ background: C.orange, color: "#fff", border: "none", padding: "11px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 14 }}>Send Another</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5 }}>First Name *</label>
                    <input placeholder="Vinoth" value={form.fn} onChange={e => setForm({ ...form, fn: e.target.value })} style={inp} onFocus={fo} onBlur={bl} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5 }}>Last Name</label>
                    <input placeholder="S." value={form.ln} onChange={e => setForm({ ...form, ln: e.target.value })} style={inp} onFocus={fo} onBlur={bl} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5 }}>Email *</label>
                  <input placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5 }}>Phone Number</label>
                  <input placeholder="+91 9XXXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5 }}>Company</label>
                  <input placeholder="Company Name (optional)" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={inp} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5 }}>Service Required</label>
                  <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} style={{ ...inp, cursor: "pointer" }} onFocus={fo} onBlur={bl}>
                    <option value="">Select a service...</option>
                    {svcs.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, display: "block", marginBottom: 5 }}>Message *</label>
                  <textarea placeholder="Tell us about your project and how we can help." rows={4} value={form.msg} onChange={e => setForm({ ...form, msg: e.target.value })} style={{ ...inp, resize: "vertical" }} onFocus={fo} onBlur={bl} />
                </div>
                <button onClick={send} style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", padding: "14px 28px", borderRadius: 8, fontWeight: 700, fontSize: 15, fontFamily: "inherit", boxShadow: `0 6px 20px rgba(249,115,22,0.3)`, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 10px 28px rgba(249,115,22,0.4)`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 6px 20px rgba(249,115,22,0.3)`; }}
                >Send Message 🚀</button>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: C.dark, marginBottom: 22 }}>Get in Touch</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
              {INFO.map((info, i) => (
                <div key={i} style={{ background: C.card, borderRadius: 14, padding: "16px 18px", border: `1px solid ${C.border}`, display: "flex", gap: 14, alignItems: "flex-start", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.orange}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{info.ic}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.dark, marginBottom: 3 }}>{info.lb}</div>
                    {info.ls.map((l, j) => <div key={j} style={{ color: C.muted, fontSize: 13.5 }}>{l}</div>)}
                  </div>
                </div>
              ))}
            </div>
            {/* Map box */}
            <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, height: 170, background: `linear-gradient(135deg,#f0fdf4,#ecfdf5)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ fontSize: 36 }}>🗺️</div>
              <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>Aranthangi, Tamil Nadu</div>
              <a href="https://maps.google.com/?q=Aranthangi,Tamil+Nadu" target="_blank" rel="noopener noreferrer" style={{ color: C.orange, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Open in Maps →</a>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.cgrid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}

/* ═══ FOOTER ═══ */
function Footer() {
  const yr = new Date().getFullYear();
  return (
    <footer style={{ background: C.dark, color: "#e5e7eb" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "64px 5% 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.4fr", gap: 48, marginBottom: 52 }} className="fgrid">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${C.orange},${C.orangeDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 14, fontFamily: "'Syne',sans-serif" }}>JS</div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#fff" }}>JStudio</div>
                <div style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 1 }}>Full-Stack Web & App Development</div>
              </div>
            </div>
            <p style={{ color: "#9ca3af", fontSize: 13.5, lineHeight: 1.8, marginBottom: 18 }}>Full-stack web applications, SaaS platforms, CRM systems, and digital apps — built for startups and businesses across India and worldwide.</p>
            {[{ ic: "✉", v: "vinodjayasudha@gmail.com", h: "mailto:vinodjayasudha@gmail.com" }, { ic: "📞", v: "+91 93803 34317 (India)", h: "tel:9380334317" }, { ic: "📍", v: "Aranthangi, Tamil Nadu, IN", h: null }].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.orange }}>{c.ic}</span>
                {c.h ? <a href={c.h} style={{ color: "#9ca3af", textDecoration: "none" }} onMouseEnter={e => e.target.style.color = C.orange} onMouseLeave={e => e.target.style.color = "#9ca3af"}>{c.v}</a> : <span style={{ color: "#9ca3af" }}>{c.v}</span>}
              </div>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Company</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["About JStudio", "Our Services", "Portfolio", "Team", "Contact"].map(l => (
                <a key={l} href="#" style={{ color: "#9ca3af", textDecoration: "none", fontSize: 13.5 }} onMouseEnter={e => e.target.style.color = C.orange} onMouseLeave={e => e.target.style.color = "#9ca3af"}>{l}</a>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Resources</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Request a Quote", "View Our Work", "Client Reviews", "Privacy Policy"].map(l => (
                <a key={l} href="#" style={{ color: "#9ca3af", textDecoration: "none", fontSize: 13.5 }} onMouseEnter={e => e.target.style.color = C.orange} onMouseLeave={e => e.target.style.color = "#9ca3af"}>{l}</a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Stay Updated</h4>
            <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>Subscribe for our latest digital marketing insights and tips.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              <input placeholder="Enter your email" style={{ border: "1px solid #374151", borderRadius: 8, padding: "10px 14px", fontSize: 13, background: "#1f2937", color: "#fff", fontFamily: "inherit", outline: "none" }} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = "#374151"} />
              <button style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", padding: "11px", borderRadius: 8, fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Subscribe →</button>
            </div>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Follow Us</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["💼", "📘", "🐦", "📸", "▶️"].map((ic, i) => (
                <button key={i} style={{ width: 34, height: 34, borderRadius: 8, background: "#1f2937", border: "1px solid #374151", cursor: "pointer", fontSize: 15, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.orange; e.currentTarget.style.borderColor = C.orange; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#1f2937"; e.currentTarget.style.borderColor = "#374151"; }}
                >{ic}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1f2937", paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ color: "#6b7280", fontSize: 13 }}>© {yr} JStudio. All rights reserved. • Made with ❤️ by the JStudio Team</div>
          <div style={{ display: "flex", gap: 18 }}>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
              <a key={l} href="#" style={{ color: "#6b7280", textDecoration: "none", fontSize: 12 }} onMouseEnter={e => e.target.style.color = C.orange} onMouseLeave={e => e.target.style.color = "#6b7280"}>{l}</a>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media(max-width:900px){.fgrid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:600px){.fgrid{grid-template-columns:1fr!important}}
      `}</style>
    </footer>
  );
}

/* ═══ APP ═══ */
export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=Nunito:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Nunito',sans-serif;background:${C.cream};color:${C.text};overflow-x:hidden}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:${C.cream}}
        ::-webkit-scrollbar-thumb{background:${C.orange};border-radius:3px}
        ::selection{background:rgba(249,115,22,0.22);color:${C.dark}}
        .gfu{opacity:1}
      `}</style>
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