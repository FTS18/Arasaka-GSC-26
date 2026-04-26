import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Sparkle } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

export default function Analytics() {
  const [a, setA] = useState(null);
  const [forecast, setForecast] = useState("");
  const [floading, setFloading] = useState(false);
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    api.get("/analytics/overview").then(r => setA(r.data));
    api.get("/analytics/audit-log").then(r => setAudit(r.data)).catch(() => {});
  }, []);

  const doForecast = async () => {
    setFloading(true);
    try {
      const r = await api.post("/ai/forecast");
      setForecast(r.data.forecast);
    } finally { setFloading(false); }
  };

  if (!a) return <div className="p-8 font-mono text-xs uppercase tracking-widest animate-pulse">Loading analytics...</div>;

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="analytics-page">
      <div>
        <div className="tc-label">Departmental Insights</div>
        <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Analytics & Impact</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="tc-card"><div className="tc-label">People Helped</div><div className="font-mono font-bold text-4xl mt-2">{a?.people_helped || 0}</div></div>
        <div className="tc-card"><div className="tc-label">Efficiency Score</div><div className="font-mono font-bold text-4xl mt-2">{a?.efficiency_score || 0}%</div></div>
        <div className="tc-card"><div className="tc-label">Top Volunteer</div><div className="font-heading font-bold text-xl mt-2">{a?.top_volunteers?.[0]?.name || "—"}</div><div className="tc-label mt-1">TRUST {Math.round(a?.top_volunteers?.[0]?.trust_score || 0)}</div></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="tc-card">
          <div className="tc-label">Requests by Category</div>
          <div className="font-heading font-bold text-lg mt-1 mb-4">Demand Distribution</div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.by_category}>
                <CartesianGrid stroke="#D1CFCA" strokeDasharray="2 4" />
                <XAxis dataKey="category" stroke="#5C5E60" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                <YAxis stroke="#5C5E60" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 12 }} />
                <Bar dataKey="count" fill="#E63946" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="tc-card">
          <div className="tc-label">Monthly Trend</div>
          <div className="font-heading font-bold text-lg mt-1 mb-4">Last 6 Months</div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={a.monthly_trend}>
                <CartesianGrid stroke="#D1CFCA" strokeDasharray="2 4" />
                <XAxis dataKey="month" stroke="#5C5E60" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                <YAxis stroke="#5C5E60" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#111213" strokeWidth={2} dot={{ fill: "#E63946" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="tc-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="tc-label">Predictive Analytics</div>
            <div className="font-heading font-bold text-lg mt-1">AI Demand Forecast</div>
          </div>
          <button className="btn-hard" onClick={doForecast} disabled={floading} data-testid="forecast-btn">
            <Sparkle size={12} weight="fill" className="inline mr-1" />
            {floading ? "FORECASTING..." : "Run 30-Day Forecast"}
          </button>
        </div>
        {forecast && <pre className="mt-4 text-sm whitespace-pre-wrap font-body leading-relaxed" data-testid="forecast-output">{forecast}</pre>}
      </div>

      <div className="tc-card">
        <div className="tc-label">Audit Trail</div>
        <div className="font-heading font-bold text-lg mt-1 mb-4">Transparency Log</div>
        <div className="divide-y divide-[var(--border)] max-h-96 overflow-auto">
          {audit.length === 0 && <div className="text-xs font-mono text-[var(--ink-soft)] py-4">ADMIN/ANALYST ONLY</div>}
          {audit.map((l) => (
            <div key={l.id} className="py-2 flex items-start gap-3 text-sm">
              <div className="font-mono text-[10px] text-[var(--ink-soft)] w-40 shrink-0">{new Date(l.timestamp).toLocaleString()}</div>
              <div className="flex-1">
                <div className="font-mono text-xs"><strong>{l.actor_name}</strong> · {l.actor_role}</div>
                <div className="text-sm">{l.action.replace(/_/g, " ")} <span className="text-[var(--ink-soft)]">→ {l.target}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
