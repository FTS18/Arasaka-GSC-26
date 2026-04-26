import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Sparkle, Pulse, HardDrive, ShieldCheck, Cpu, Eye, Broadcast } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";

const QuotaBar = ({ label, used, total, icon: Icon, color = "var(--ink)" }) => {
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div className="tc-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[var(--ink-soft)] text-[10px] font-black tracking-widest">
            <Icon size={12}/> {label}
        </div>
        <div className="font-mono text-[10px] font-black">{pct}%</div>
      </div>
      <div className="font-mono text-xl font-black mb-2">{used} <span className="text-[10px] font-normal opacity-40">/ {total}</span></div>
      <div className="w-full bg-[var(--bone-alt)] h-1.5 overflow-hidden">
        <div 
          className="h-full transition-all duration-1000" 
          style={{ width: `${pct}%`, backgroundColor: pct > 80 ? 'var(--signal-red)' : color }}
        />
      </div>
    </div>
  );
};

export default function Analytics() {
  const [forecast, setForecast] = useState("");
  const [floading, setFloading] = useState(false);

  const { data: a } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const r = await api.get("/analytics/overview");
      return r.data;
    }
  });

  const { data: audit = [] } = useQuery({
    queryKey: ['audit-log'],
    queryFn: async () => {
      const r = await api.get("/analytics/audit-log");
      return r.data;
    }
  });

  const { data: usage } = useQuery({
    queryKey: ['system-usage'],
    queryFn: async () => {
      const r = await api.get("/admin/system/usage");
      return r.data;
    },
    refetchInterval: 10000 
  });

  const doForecast = async () => {
    setFloading(true);
    try {
      const r = await api.post("/ai/forecast");
      setForecast(r.data.forecast);
    } catch(e) { console.error(e); }
    finally { setFloading(false); }
  };

  if (!a) return <div className="p-8 font-mono text-[10px] tracking-tighter text-[var(--ink-soft)] text-center mt-20">Establishing command link...</div>;

  return (
    <div className="p-6 md:p-8 space-y-8" data-testid="analytics-page">
      <div className="flex justify-between items-end">
        <div>
          <div className="tc-label">Tactical Telemetry</div>
          <h1 className="font-heading text-5xl font-black tracking-tighter mt-1 leading-none">Command Intelligence</h1>
        </div>
        <div className="hidden md:block font-mono text-[10px] text-right text-[var(--ink-soft)]">
            Protocol: GDC-Arasaka-26<br/>
            Ref: Janus-Sentinel
        </div>
      </div>

      {/* 🚀 Integrated API & AI Quota Monitor */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
            <h2 className="tc-label !mb-0">Global Resource Quotas</h2>
            <div className="h-px flex-1 bg-[var(--border)]"></div>
            <div className={`px-2 py-0.5 font-mono text-[10px] font-bold ${usage?.status === "operational" ? "bg-green-600" : "bg-[var(--signal-red)]"} text-white`}>
                System: {usage?.status || "Pending"}
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {/* Firestore Matrix */}
           <QuotaBar label="Firestore Reads" used={usage?.usage?.reads || 0} total={usage?.limits?.reads || 50000} icon={ShieldCheck} color="var(--signal-red)"/>
           <QuotaBar label="Firestore Writes" used={usage?.usage?.writes || 0} total={usage?.limits?.writes || 20000} icon={Pulse} color="var(--ink)"/>
           
           {/* Gemini Intelligence */}
           <QuotaBar label="Gemini 2.5 Flash" used={usage?.usage?.gemini_flash || 0} total={usage?.limits?.gemini_flash || 1500} icon={Cpu} color="#4285F4"/>
           <QuotaBar label="Gemini Vision" used={usage?.usage?.gemini_vision || 0} total={usage?.limits?.gemini_vision || 500} icon={Eye} color="#FBBC04"/>
           
           {/* Comms & System */}
           <QuotaBar label="Telegram Ops" used={usage?.usage?.telegram_ops || 0} total={usage?.limits?.telegram_ops || 10000} icon={Broadcast} color="#34A853"/>
           <QuotaBar label="Memory Cache" used={84} total={100} icon={HardDrive} color="var(--ink-soft)"/>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="tc-card bg-[var(--bone-alt)]"><div className="tc-label">TOTAL IMPACT</div><div className="font-mono font-bold text-4xl mt-2">{a?.people_helped || 0} <span className="text-xs font-normal opacity-40">LIVES</span></div></div>
        <div className="tc-card"><div className="tc-label">OPERATIONAL EFFICIENCY</div><div className="font-mono font-bold text-4xl mt-2">{a?.efficiency_score || 0}%</div></div>
        <div className="tc-card"><div className="tc-label">COMMANDER TRUST</div><div className="font-heading font-bold text-xl mt-2">{a?.top_volunteers?.[0]?.name || "—"}</div><div className="tc-label mt-1 italic">Level: {Math.round(a?.top_volunteers?.[0]?.trust_score || 0)}/100</div></div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="tc-card">
              <div className="tc-label">Demand Hierarchy</div>
              <div className="h-[240px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={a.by_category}>
                    <CartesianGrid stroke="#D1CFCA" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="category" hide />
                    <YAxis stroke="#5C5E60" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                    <Tooltip cursor={{fill: '#f5f5f5'}} 
                       contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 12, border: '2px solid black', borderRadius: 0 }} 
                       formatter={(v, name, props) => [v, props.payload.category]}
                    />
                    <Bar dataKey="count" fill="var(--signal-red)" stroke="var(--ink)" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="tc-card">
              <div className="tc-label">Load Progression</div>
              <div className="h-[240px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={a.monthly_trend}>
                    <CartesianGrid stroke="#D1CFCA" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="month" stroke="#5C5E60" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                    <YAxis stroke="#5C5E60" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 12, border: '2px solid black', borderRadius: 0 }} />
                    <Line type="monotone" dataKey="count" stroke="var(--ink)" strokeWidth={4} dot={{ fill: "var(--signal-red)", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="tc-card border-[var(--signal-red)] border-l-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h3 className="font-heading font-black text-xl leading-none">AI Strategic Forecast</h3>
                    <p className="text-[10px] font-mono text-[var(--ink-soft)] mt-1">Gemini 2.5 Flash predictive engine active</p>
                </div>
                <button 
                  onClick={doForecast} 
                  disabled={floading}
                  className="bg-[var(--ink)] text-white px-6 py-2 font-black text-[11px] hover:bg-[var(--signal-red)] transition-all flex items-center gap-2"
                >
                    {floading ? <Pulse size={14} className="animate-spin"/> : <Sparkle size={14} weight="fill"/>}
                    {floading ? "Processing..." : "Generate Insights"}
                </button>
            </div>
            {forecast ? (
                <div className="p-5 bg-[var(--bone-alt)] border-2 border-[var(--ink)] font-mono text-[11px] leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-2">
                    {forecast}
                </div>
            ) : (
                <div className="text-center py-10 text-[var(--ink-soft)] font-mono text-[10px] border-2 border-dashed border-[var(--border)]">
                    Perform triage analysis to unlock predictive insights
                </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="tc-card h-full flex flex-col">
            <div className="tc-label mb-4">Operations Ticker</div>
            <div className="flex-1 divide-y divide-[var(--border)] overflow-auto max-h-[600px] pr-2 custom-scrollbar">
              {audit.length === 0 && <div className="text-xs font-mono text-[var(--ink-soft)] py-10 text-center tracking-tighter">No operational history</div>}
              {audit.map((l) => (
                <div key={l.id} className="py-4 group">
                   <div className="flex justify-between items-center mb-1">
                      <div className="text-[10px] font-black tracking-widest text-[var(--ink-soft)] group-hover:text-[var(--signal-red)] transition-colors">{l.actor_name}</div>
                      <div className="font-mono text-[8px] opacity-40">{new Date(l.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                   </div>
                   <div className="text-[9px] font-mono leading-tight text-[var(--ink-muted)]">
                      <span className="opacity-50 tracking-widest">{l.actor_role} //</span> {l.action.replace(/_/g, " ")} 
                      <div className="mt-1 text-[var(--ink)] font-bold truncate">TARGET: {l.target}</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
