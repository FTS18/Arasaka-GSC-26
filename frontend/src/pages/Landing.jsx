import React from "react";
import { Link } from "react-router-dom";
import { Radio, ArrowRight, ShieldCheck, Gauge, MapTrifold, HandHeart } from "@phosphor-icons/react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bone)]">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={22} weight="fill" className="text-[var(--signal-red)]" />
            <span className="font-heading text-xl font-black tracking-tighter">HUMOPS</span>
            <span className="overline ml-2 hidden md:inline">COMMAND CENTER</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/citizen" className="btn-ghost" data-testid="cta-citizen-report">Citizen Report</Link>
            <Link to="/login" className="btn-hard" data-testid="cta-login">Operator Login <ArrowRight size={12} className="inline ml-1" /></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-12 gap-8 tc-gridline">
        <div className="md:col-span-7">
          <div className="overline">Smart Resource Allocation · v1.0</div>
          <h1 className="font-heading text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mt-4">
            Turn scattered<br />
            signals into <span className="text-[var(--signal-red)]">coordinated relief.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-[var(--ink-soft)] max-w-xl leading-relaxed">
            A field-ready command console for NGOs and volunteer networks — triage urgent needs, dispatch the right people, route resources, and measure impact in real time.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link to="/login" className="btn-primary" data-testid="hero-login-btn">Enter Console</Link>
            <Link to="/citizen" className="btn-ghost" data-testid="hero-report-btn">Report a Need</Link>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              ["AI", "PRIORITY ENGINE"],
              ["GEO", "HEATMAPS"],
              ["6 ROLES", "RBAC"],
              ["EN · हिं", "MULTILINGUAL"],
            ].map(([v, l]) => (
              <div key={l} className="border-l border-[var(--ink)] pl-4">
                <div className="font-mono text-xl font-bold">{v}</div>
                <div className="overline mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="tc-card p-0 overflow-hidden">
            <img
              src="https://images.pexels.com/photos/11776598/pexels-photo-11776598.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="Field operations"
              className="w-full h-[420px] object-cover"
            />
            <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="overline">Live Feed</div>
                <div className="font-mono text-sm mt-1">EAST DELHI · ZONE-4 · FLOOD RESPONSE</div>
              </div>
              <div className="tc-badge tc-badge-crit">CRITICAL</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--border)] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="overline">Capabilities</div>
          <h2 className="font-heading text-3xl md:text-4xl font-black tracking-tighter mt-2 max-w-3xl">
            A tactical stack for humanitarian logistics.
          </h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { icon: Gauge, t: "AI Prioritization", d: "Multi-factor scoring across urgency, vulnerability, waiting time, severity, weather, and demand history." },
              { icon: HandHeart, t: "Volunteer Matching", d: "Trust-scored matchmaking by proximity, skills, languages, transport, and availability." },
              { icon: MapTrifold, t: "Geospatial Intel", d: "Cluster maps and heat signatures to detect hotspots, outbreaks, and under-served zones." },
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
          <div className="font-mono text-xs text-[var(--ink-soft)]">HUMOPS · Humanitarian Operations Command Center</div>
          <div className="font-mono text-xs text-[var(--ink-muted)]">Built for NGOs, volunteers, and citizens.</div>
        </div>
      </footer>
    </div>
  );
}
