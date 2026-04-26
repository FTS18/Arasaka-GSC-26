import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Pulse, 
  Users, 
  CheckCircle, 
  Warning, 
  Clock, 
  ShieldCheck, 
  ChartBar,
  Broadcast
} from "@phosphor-icons/react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const StatCard = ({ label, value, icon: Icon, trend, colorClass = "text-[var(--signal-red)]" }) => (
  <div className="tc-card overflow-hidden group hover:border-[var(--signal-red)] transition-all">
    <div className="flex justify-between items-start">
      <div className="tc-label">{label}</div>
      <Icon size={20} className={colorClass} />
    </div>
    <div className="font-heading font-black text-4xl mt-2 tracking-tighter">{value}</div>
    {trend && (
      <div className="text-[10px] font-mono mt-2 flex items-center gap-1 text-[var(--ink-soft)]">
        <span className={trend.startsWith("+") ? "text-green-500" : "text-red-500"}>{trend}</span> vs last 12h
      </div>
    )}
  </div>
);

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const [overview, sitrep, trends] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/needs?limit=10&sort_by=created_at&sort_dir=-1"),
        api.get("/analytics/trend")
      ]);
      setData(overview.data);
      setLogs(sitrep.data || []);
      setChartData(trends.data || []);
      setLoading(false);
      setTimeout(() => setIsSyncing(false), 2000);
    } catch (err) {
      toast.error("Command Link Failure: Data Fetch Error");
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const toggleDisasterMode = async () => {
    const newMode = !data?.disaster_mode;
    try {
      await api.post("/system/state", { 
        disaster_mode: newMode,
        disaster_reason: newMode ? "Emergency Triggered via Console" : "Crisis Terminated"
      });
      toast.success(newMode ? "DISASTER MODE ACTIVE" : "CRISIS OVER - RETURNING TO NORMAL");
      fetchData();
    } catch (err) {
      toast.error("Failed to toggle system state");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 font-mono text-xs uppercase tracking-widest animate-pulse">Loading telemetry...</div>;

  return (
    <div className="p-6 md:p-8 space-y-10" data-testid="admin-dashboard">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${data?.disaster_mode ? "bg-[var(--signal-red)] text-white" : "bg-[var(--ink)] text-white"}`}>
               {data?.disaster_mode ? "Emergency Response" : "Normal Operations"}
            </div>
            <div className="tc-label !mb-0 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`} />
              Telemetry Feed
            </div>
          </div>
          <h1 className="font-heading text-5xl font-black tracking-tighter uppercase">
            Operational Overview
          </h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/map" className="btn-ghost flex items-center gap-2 !border-2">
             <Broadcast size={18} weight="bold" /> OPERATIONS MAP
          </Link>
          <button 
            onClick={toggleDisasterMode}
            className={`btn-primary flex items-center gap-2 transition-all !px-6 !border-2 !shadow-[4px_4px_0px_var(--ink)] active:translate-y-1 active:shadow-none ${data?.disaster_mode ? "!bg-green-600 hover:!bg-green-700" : "!bg-[var(--signal-red)]"}`}
          >
            {data?.disaster_mode ? <ShieldCheck size={20} weight="bold" /> : <Warning size={20} weight="bold" />}
            <span className="font-black">{data?.disaster_mode ? "STAND DOWN SYSTEM" : "INITIATE DISASTER MODE"}</span>
          </button>
        </div>
      </div>

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="CRITICAL NEEDS" 
          value={data?.needs_by_urgency?.[5] || 0} 
          icon={Warning} 
          trend="+4%" 
        />
        <StatCard 
          label="ACTIVE MISSIONS" 
          value={data?.total_missions || 0} 
          icon={Pulse} 
          trend="+12%" 
          colorClass="text-blue-500"
        />
        <StatCard 
          label="VOLUNTEERS ACTIVE" 
          value={data?.total_volunteers || 0} 
          icon={Users} 
          trend="+2" 
          colorClass="text-green-500"
        />
        <StatCard 
          label="AVG RESOLUTION" 
          value="2.4h" 
          icon={Clock} 
          trend="-15m" 
          colorClass="text-purple-500"
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Operational View */}
        <div className="lg:col-span-8 space-y-8">
          <section className="tc-card min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div className="tc-label flex items-center gap-2">
                Response Capacity (24h)
              </div>
            </div>
            <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData}>
                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--ink)', border: 'none', borderRadius: '4px', color: 'var(--bone)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="active" 
                    stroke="var(--signal-red)" 
                    fill="var(--signal-red)" 
                    fillOpacity={0.1} 
                    strokeWidth={4} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-8">
            <div className="tc-card">
              <div className="tc-label mb-4">RESOURCES BY CATEGORY</div>
              <div className="space-y-4">
                {Object.entries(data?.resources_by_category || {}).slice(0, 5).map(([cat, count]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-[var(--ink-soft)]">
                      <span>{cat.replace(/_/g, " ")}</span>
                      <span>{count} UNIT</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--ink)]" style={{ width: `${Math.min(100, (count / 50) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <section className="tc-card">
              <h3 className="tc-label mb-6">Recent Alerts</h3>
              <div className="tc-table-container overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="tc-table-header">
                      <th className="text-left p-2">Timestamp</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data?.needs?.slice(0, 5).map((n) => (
                      <tr key={n.id} className="text-sm font-mono hover:bg-[var(--bone-alt)]">
                        <td className="py-3 px-2 tabular-nums">{new Date(n.created_at).toLocaleTimeString()}</td>
                        <td className="py-3 px-2 font-bold">{n.category.replace(/_/g, " ")}</td>
                        <td className="py-3 px-2">
                          <span className={`tc-badge ${n.urgency >= 4 ? "tc-badge-crit" : "tc-badge-outl"}`}>
                            U{n.urgency}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </div>

        {/* Live Sit-Rep Activity Log */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-black tracking-tight">Live Sit-Rep</h2>
            <div className="tc-label animate-pulse text-[var(--signal-red)]">FEED ACTIVE</div>
          </div>
          
          <div className="tc-card p-0 bg-[var(--bone-alt)] divide-y divide-[var(--border)] overflow-hidden">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-white transition-colors cursor-crosshair group">
                <div className="flex justify-between text-[8px] font-mono text-[var(--ink-muted)] uppercase tracking-widest mb-1">
                  <span>LAT: {log.location.lat.toFixed(4)}</span>
                  <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="text-sm font-black group-hover:text-[var(--signal-red)] leading-tight">{log.title}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${log.urgency >= 4 ? 'bg-[var(--signal-red)]' : 'bg-gray-400'}`} />
                  <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase">{log.status}</span>
                </div>
              </div>
            ))}
            <button className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[var(--ink)] hover:text-white transition-all">
              View Full Audit Log
            </button>
          </div>

          <div className="tc-card bg-[var(--signal-red)] text-white border-none shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={20} weight="fill" />
              <span className="font-mono text-xs font-bold tracking-widest">ENFORCEMENT ACTIVE</span>
            </div>
            <div className="text-xl font-heading font-bold leading-tight">
              3 UNAUTHORIZED ATTEMPTS BLOCKED IN SECTOR-B
            </div>
            <div className="mt-4 text-[10px] font-mono text-white/70 uppercase">
              RBAC Protocol v2.1 // GDC-LINK SECURE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
