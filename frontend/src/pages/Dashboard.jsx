import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Warning, Users, Package, ClipboardText, Gauge, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";

const Stat = ({ label, value, variant, testid }) => (
  <div className={`tc-card ${variant === "crit" ? "tc-card-crit" : ""}`} data-testid={testid}>
    <div className="tc-overline">{label}</div>
    <div className="font-mono font-bold text-4xl mt-3 tracking-tight">{value}</div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [ai, setAi] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    try {
      const [s, n] = await Promise.all([api.get("/dashboard/stats"), api.get("/needs?limit=6")]);
      setStats(s.data);
      setNeeds(n.data);
    } catch (e) { toast.error("Failed to load dashboard"); }
  };

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);

  const askAi = async () => {
    setAiLoading(true);
    try {
      const r = await api.post("/ai/insight", { query: "What should my team focus on for the next 6 hours?" });
      setAi(r.data.response);
    } catch { toast.error("AI unavailable"); }
    finally { setAiLoading(false); }
  };

  if (!stats) return <div className="p-8 font-mono text-sm">GATHERING INTEL...</div>;

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="dashboard-page">
      <div className="tc-scan mb-4"></div>
      <div className="flex items-end justify-between">
        <div>
          <div className="tc-overline">JANRAKSHAK GSC-26 CONSOLE</div>
          <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tighter mt-1">Field Intelligence</h1>
        </div>
        <Link to="/needs/new" className="btn-primary" data-testid="dash-new-request-btn">+ New Request</Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="CRITICAL" value={stats.critical_needs} variant="crit" testid="stat-critical" />
        <Stat label="ACTIVE REQUESTS" value={stats.active_needs} testid="stat-active" />
        <Stat label="RESOLVED" value={stats.resolved_needs} testid="stat-resolved" />
        <Stat label="VOLUNTEERS ON-CALL" value={stats.volunteers_available} testid="stat-volunteers-available" />
        <Stat label="ACTIVE MISSIONS" value={stats.missions_active} testid="stat-missions-active" />
        <Stat label="COMPLETED MISSIONS" value={stats.missions_completed} testid="stat-missions-completed" />
        <Stat label="RESOURCE SHORTAGES" value={stats.resource_shortages} variant={stats.resource_shortages > 0 ? "crit" : ""} testid="stat-shortages" />
        <Stat label="AVG RESPONSE (H)" value={stats.avg_response_hours} testid="stat-response" />
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Priority queue */}
        <div className="md:col-span-8 tc-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="tc-overline">Priority Queue</div>
              <div className="font-heading text-xl font-bold mt-1">Top Requests — AI Ranked</div>
            </div>
            <Link to="/needs" className="btn-ghost" data-testid="dash-view-all-needs">View all</Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {needs.map((n) => (
              <Link to={`/needs/${n.id}`} key={n.id} className="flex items-start gap-4 py-4 hover:bg-[var(--bone-alt)] transition-colors" data-testid={`need-row-${n.id}`}>
                <div className="font-mono font-bold text-2xl w-16 text-[var(--signal-red)]">{Math.round(n.priority_score)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`tc-badge ${n.urgency >= 4 ? "tc-badge-crit" : n.urgency === 3 ? "tc-badge-high" : "tc-badge-outl"}`}>U{n.urgency}</span>
                    <span className="tc-badge tc-badge-outl">{n.category.replace(/_/g, " ")}</span>
                    <span className="font-mono text-xs text-[var(--ink-soft)]">· {n.people_affected} affected</span>
                  </div>
                  <div className="font-heading font-bold text-base mt-1">{n.title}</div>
                  <div className="text-xs text-[var(--ink-soft)] line-clamp-1 mt-1">{n.description}</div>
                </div>
                <div className="text-right">
                  <div className={`tc-badge ${n.status === "completed" ? "tc-badge-res" : n.status === "pending" ? "tc-badge-high" : "tc-badge-mon"}`}>
                    {n.status}
                  </div>
                </div>
              </Link>
            ))}
            {needs.length === 0 && <div className="py-10 text-center text-[var(--ink-soft)] font-mono text-sm">NO ACTIVE REQUESTS</div>}
          </div>
        </div>

        {/* AI Insight */}
        <div className="md:col-span-4 tc-card">
          <div className="font-heading text-xl font-bold mt-1 flex items-center gap-2">
            <Sparkle size={18} weight="fill" className="text-[var(--signal-red)]" /> Janrakshak Intel
          </div>
          <button className="btn-hard w-full mt-4" onClick={askAi} disabled={aiLoading} data-testid="ai-insight-btn">
            {aiLoading ? "THINKING..." : "ASK FOR OPS BRIEFING"}
          </button>
          <div className="mt-4 text-sm leading-relaxed whitespace-pre-wrap" data-testid="ai-insight-output">
            {ai || <span className="text-[var(--ink-soft)] font-mono text-xs">Press the button for a strategic briefing based on live metrics.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
