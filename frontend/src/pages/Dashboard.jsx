import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Warning, Users, Package, ClipboardText, Gauge, Sparkle, MagnifyingGlass } from "@phosphor-icons/react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const Spark = ({ color }) => {
  // Mock trend data for visual polish
  const data = [...Array(12)].map((_, i) => ({ val: Math.floor(Math.random() * 20) + 10 }));
  return (
    <div className="tc-sparkline-container h-[40px] w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey="val" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={1.5} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const Stat = ({ label, value, variant, testid }) => (
  <div className={`tc-card p-3 md:p-5 overflow-hidden ${variant === "crit" ? "tc-card-crit" : ""}`} data-testid={testid}>
    <div className="flex justify-between items-start">
      <div className="tc-label text-[10px] md:text-xs leading-tight">{label}</div>
      {variant === "crit" && value > 0 && <div className="tc-pulse" />}
    </div>
    <div className="font-mono font-bold text-2xl md:text-4xl mt-1 md:mt-3 tracking-tighter">{value}</div>
    <div className="hidden md:block">
      <Spark color={variant === "crit" ? "var(--signal-red)" : "var(--ink-soft)"} />
    </div>
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

  if (!stats) return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-[var(--bone-alt)] animate-pulse rounded" />
          <div className="h-10 w-64 bg-[var(--bone-alt)] animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-[var(--bone-alt)] animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="tc-card h-32 animate-pulse bg-[var(--bone-alt)]" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6" data-testid="dashboard-page">
      <div className="flex items-end justify-between">
        <div className="min-w-0">
          <div className="tc-label truncate">Janrakshak Console</div>
          <h1 className="font-heading text-3xl md:text-4xl font-black tracking-tighter mt-1 truncate">Strategic Overview</h1>
        </div>
        <Link to="/needs/new" className="btn-primary shrink-0 scale-90 md:scale-100 origin-right" data-testid="dash-new-request-btn">+ New</Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Stat label="Critical" value={stats.critical_needs} variant="crit" testid="stat-critical" />
        <Stat label="Active Requests" value={stats.active_needs} testid="stat-active" />
        <Stat label="Resolved" value={stats.resolved_needs} testid="stat-resolved" />
        <Stat label="On-Call" value={stats.volunteers_available} testid="stat-volunteers-available" />
        <Stat label="In Mission" value={stats.missions_active} testid="stat-missions-active" />
        <Stat label="Missions Done" value={stats.missions_completed} testid="stat-missions-completed" />
        <Stat label="Shortages" value={stats.resource_shortages} variant={stats.resource_shortages > 0 ? "crit" : ""} testid="stat-shortages" />
        <Stat label="Avg Resp (h)" value={stats.avg_response_hours} testid="stat-response" />
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Priority queue */}
        <div className="md:col-span-8 tc-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="tc-label">Priority Queue</div>
              <div className="font-heading text-xl font-bold mt-1">Top Requests — Impact Priority</div>
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
            {needs.length === 0 && <div className="py-10 text-center text-[var(--ink-soft)] font-mono text-sm">No active requests found</div>}
          </div>
        </div>

        {/* AI Insight */}
        <div className="md:col-span-4 tc-card">
          <div className="font-heading text-xl font-bold mt-1 flex items-center gap-2">
            <Sparkle size={18} weight="fill" className="text-[var(--signal-red)]" /> Field Ops Digest
          </div>
          <button className="btn-hard w-full mt-4" onClick={askAi} disabled={aiLoading} data-testid="ai-insight-btn">
            {aiLoading ? "Synthesizing..." : "Generate Strategic Briefing"}
          </button>
          <div className="mt-4 text-sm leading-relaxed whitespace-pre-wrap" data-testid="ai-insight-output">
            {ai || <span className="text-[var(--ink-soft)] font-mono text-xs">Analyze current field metrics for high-impact recommendations.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
