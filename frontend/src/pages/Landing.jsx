import React from "react";
import { Link } from "react-router-dom";
import { Radio, ArrowRight, ShieldCheck, Gauge, MapTrifold, HandHeart } from "@phosphor-icons/react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bone)] pb-24 md:pb-0">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={22} weight="fill" className="text-[var(--signal-red)]" />
            <span className="font-heading text-xl font-black tracking-tighter">JANRAKSHAK</span>
            <span className="tc-label ml-2 hidden md:inline">RELIEF NETWORK OPERATIONS</span>
          </div>
          <nav className="hidden md:flex items-center gap-3">
            <Link to="/citizen" className="btn-ghost" data-testid="cta-citizen-report">Citizen Report</Link>
            <Link to="/login" className="btn-hard" data-testid="cta-login">Operator Login <ArrowRight size={12} className="inline ml-1" /></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="main-content" className="max-w-7xl mx-auto px-6 py-10 md:py-16 grid md:grid-cols-12 gap-8 tc-gridline">
        <div className="md:col-span-7">
          <div className="tc-label">Operational Platform · Janrakshak</div>
          <h1 className="font-heading text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mt-2">
            Turn field<br />
            data into <span className="text-[var(--signal-red)]">decisive action.</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-[var(--ink-soft)] max-w-xl leading-relaxed">
            A high-stakes command console for NGOs and rapid response networks — triage crisis signals, dispatch vetted personnel, and route critical resources with precision.
          </p>
          {/* Hero CTAs - Hidden on mobile, sticky bar handles it */}
          <div className="mt-6 hidden md:flex items-center gap-3">
            <Link to="/login" className="btn-primary" data-testid="hero-login-btn">Enter Console</Link>
            <Link to="/citizen" className="btn-ghost" data-testid="hero-report-btn">Report a Need</Link>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="tc-card p-0 overflow-hidden">
            <img
              src="https://images.pexels.com/photos/11776598/pexels-photo-11776598.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="Field operations personnel coordinating in sector-09"
              width="940"
              height="650"
              loading="eager"
              className="w-full h-auto object-cover"
            />
            <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="tc-label">Live Feed</div>
                <div className="font-mono text-sm mt-1">SOUTH DISTRICT · ZONE 4 · STATUS: PENDING</div>
              </div>
              <div className="tc-badge tc-badge-crit">CRITICAL</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tactical Stats Strip - Full Width Strip/Marquee */}
      <section className="border-y border-[var(--ink)] bg-white overflow-hidden tc-marquee-container">
        <div className="max-w-px md:max-w-7xl mx-auto flex tc-marquee-content md:divide-x divide-[var(--ink)]">
          {[
            ["AI", "PRIORITY ENGINE", true],
            ["GEO", "HEATMAPS"],
            ["6 ROLES", "RBAC"],
            ["EN · हिं", "MULTILINGUAL"],
            ["24/7", "OPS READY"],
          ].map(([v, l, blink]) => (
            <div key={l} className="flex-none md:flex-1 px-8 py-4 flex items-baseline gap-3 group transition-colors hover:bg-[var(--bone)] relative border-r border-[var(--ink)] md:border-r-0">
              <span className="font-heading text-2xl font-black tracking-tighter group-hover:text-[var(--signal-red)] transition-colors flex items-center gap-2">
                {v}
                {blink && <span className="w-2 h-2 rounded-full bg-[var(--signal-red)] animate-pulse" />}
              </span>
              <span className="tc-label whitespace-nowrap opacity-70">{l}</span>
            </div>
          ))}
          {/* Duplicate for Marquee Loop on Mobile */}
          <div className="md:hidden flex">
            {[
              ["AI", "PRIORITY ENGINE", true],
              ["GEO", "HEATMAPS"],
              ["6 ROLES", "RBAC"],
              ["EN · हिं", "MULTILINGUAL"],
              ["24/7", "OPS READY"],
            ].map(([v, l, blink]) => (
              <div key={`${l}-dup`} className="flex-none px-8 py-4 flex items-baseline gap-3 border-r border-[var(--ink)]">
                <span className="font-heading text-2xl font-black tracking-tighter flex items-center gap-2">
                  {v}
                  {blink && <span className="w-2 h-2 rounded-full bg-[var(--signal-red)] animate-pulse" />}
                </span>
                <span className="tc-label whitespace-nowrap opacity-70">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--border)] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="tc-label">Capabilities</div>
          <h2 className="font-heading text-3xl md:text-4xl font-black tracking-tighter mt-2 max-w-3xl">
            A tactical stack for humanitarian logistics.
          </h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { icon: Gauge, t: "Priority Engine", d: "Multi-factor scoring across urgency, vulnerability, waiting time, severity, weather, and demand history." },
              { icon: HandHeart, t: "Volunteer Matching", d: "Trust-scored matchmaking by proximity, skills, languages, transport, and availability." },
              { icon: MapTrifold, t: "Zone Mapping", d: "Cluster maps and heat signatures to detect hotspots, outbreaks, and under-served zones." },
              { icon: ShieldCheck, t: "Transparency", d: "Proof-of-completion photos, immutable audit logs, donor reports, public impact summaries." },
              { icon: Radio, t: "Disaster Mode", d: "One-toggle re-prioritization of every active request during floods, fires, riots, or heatwaves." },
              { icon: Gauge, t: "Impact Analytics", d: "People helped, response time, efficiency, category trends, top volunteers, under-served regions." },
            ].map((f, i) => (
              <div key={i} className="tc-card">
                <f.icon size={22} weight="duotone" className="text-[var(--signal-red)]" />
                <div className="font-heading font-bold text-lg mt-3">{f.t}</div>
                <p className="text-sm text-[var(--ink-soft)] mt-2 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="font-mono text-xs text-[var(--ink-soft)] tracking-widest">JANRAKSHAK · RELIEF NETWORK</div>
          <div className="font-mono text-xs text-[var(--ink-muted)] tracking-wider">Integrated Resource Logistics System</div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="tc-mobile-cta md:hidden">
        <Link to="/login" className="btn-primary flex-1 text-center py-4" data-testid="mobile-cta-login">
          Enter Console
        </Link>
        <Link to="/citizen" className="btn-ghost flex-1 text-center py-4" data-testid="mobile-cta-report">
          Report Need
        </Link>
      </div>
    </div>
  );
}
