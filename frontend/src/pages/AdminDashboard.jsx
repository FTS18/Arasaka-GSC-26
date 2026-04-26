import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Broadcast,
  HardDrive
} from "@phosphor-icons/react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const StatCard = ({ label, value, icon: Icon, trend, colorClass = "text-[var(--signal-red)]", subtext }) => {
  const formattedValue = typeof value === 'string' 
    ? value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    : value;

  return (
    <div className="tc-card overflow-hidden group hover:border-[var(--signal-red)] transition-all flex flex-col justify-between h-full">
      <div className="flex justify-between items-start">
        <div className="tc-label">{label}</div>
        <Icon size={20} className={colorClass} />
      </div>
      <div className="font-heading font-black text-4xl mt-2 tracking-tighter">{formattedValue}</div>
      {subtext ? (
         <div className="text-[10px] font-mono mt-2 text-[var(--ink-soft)]">{subtext}</div>
      ) : trend && (
        <div className="text-[10px] font-mono mt-2 flex items-center gap-1 text-[var(--ink-soft)]">
          <span className={trend.startsWith("+") ? "text-green-500" : "text-red-500"}>{trend}</span> vs last 12h
        </div>
      )}
    </div>
  );
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: b, isLoading, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      setIsSyncing(true);
      const [stats, sitrep, trends] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/needs?limit=10&sort_by=created_at&sort_dir=-1&projection=short"),
        api.get("/analytics/trend")
      ]);
      setIsSyncing(false);
      return { 
        overview: stats.data, 
        sitrep: sitrep.data || [],
        trends: trends.data || []
      };
    }
  });

  const { data: usage } = useQuery({
    queryKey: ['system-usage'],
    queryFn: async () => {
      const r = await api.get("/admin/system/usage");
      return r.data;
    },
    refetchInterval: 15000 // Radar sweep every 15s
  });

  const mutation = useMutation({
    mutationFn: async (newMode) => {
      return api.post("/system/state", { 
        disaster_mode: newMode,
        disaster_reason: newMode ? "Emergency Triggered via Console" : "Crisis Terminated"
      });
    },
    onMutate: async (newMode) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['admin-overview'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['admin-overview']);

      // Optimistically update to the new value
      queryClient.setQueryData(['admin-overview'], (old) => ({
        ...old,
        overview: {
          ...old?.overview,
          disaster_mode: newMode
        }
      }));

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err, newMode, context) => {
      queryClient.setQueryData(['admin-overview'], context.previousData);
      toast.error("Tactical override failed: Link severed");
    },
    onSuccess: (data, newMode) => {
      toast.success(newMode ? "Disaster Mode Active" : "Crisis Terminated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  const toggleDisasterMode = () => {
    mutation.mutate(!b?.overview?.disaster_mode);
  };

  if (isLoading) return <div className="p-8 font-mono text-xs tracking-widest animate-pulse">Loading field data...</div>;

  const data = b.overview;
  const logs = b.sitrep;
  const chartData = b.trends;

  return (
    <div className="p-6 md:p-8 space-y-10" data-testid="admin-dashboard">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`px-2 py-0.5 font-mono text-[10px] font-bold ${data?.disaster_mode ? "bg-[var(--signal-red)] text-white" : "bg-[var(--ink)] text-[var(--bone)]"}`}>
               {data?.disaster_mode ? "Emergency Response" : "Normal Operations"}
            </div>
            <div className="tc-label !mb-0 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`} />
              Telemetry Feed
            </div>
          </div>
          <h1 className="font-heading text-5xl font-black tracking-tight">
            Command Center
          </h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/map" className="btn-ghost flex items-center gap-2 !border-2 font-black text-xs">
             <Broadcast size={18} weight="bold" /> Operations Map
          </Link>
          <button 
            onClick={toggleDisasterMode}
            className={`flex items-center gap-2 transition-all px-6 py-2 border-2 shadow-[4px_4px_0px_var(--ink)] active:translate-y-1 active:shadow-none font-black text-xs ${data?.disaster_mode ? "bg-green-600 text-white border-green-700" : "bg-[var(--signal-red)] text-white border-red-700"}`}
          >
            {data?.disaster_mode ? <ShieldCheck size={20} weight="bold" /> : <Warning size={20} weight="bold" />}
            <span>{data?.disaster_mode ? "Exit Disaster Mode" : "Initiate Disaster Mode"}</span>
          </button>
        </div>
      </div>

      {/* 🏛️ Strategy 7: Strategic Data Hub (Quota + Volume) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Firestore Reads" 
          value={usage?.usage?.reads || 0} 
          icon={ShieldCheck} 
          subtext={`Limit: ${usage?.usage_percentage?.reads || 0}% Used`}
          colorClass="text-blue-500"
        />
        <StatCard 
          label="Firestore Writes" 
          value={usage?.usage?.writes || 0} 
          icon={Pulse} 
          subtext={`Limit: ${usage?.usage_percentage?.writes || 0}% Used`}
          colorClass="text-green-500"
        />
        <StatCard 
          label="Critical Gaps" 
          value={data?.needs_by_urgency?.[5] || 0} 
          icon={Warning} 
          trend="+4%" 
        />
        <StatCard 
          label="Quota Status" 
          value={usage?.status || "OK"} 
          icon={HardDrive} 
          subtext={`Uptime: ${usage?.uptime || "0m"}`}
          colorClass={usage?.status === "CRITICAL" ? "text-red-500" : "text-green-600"}
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="tc-card min-h-[400px]">
            <div className="tc-label mb-8">Incident Response Capacity (24h)</div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--signal-red)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--signal-red)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--ink)', border: 'none', borderRadius: '0px', color: 'var(--bone)', fontFamily: 'Sora' }}
                  />
                  <Area 
                    type="stepAfter" 
                    dataKey="active" 
                    stroke="var(--signal-red)" 
                    fill="url(#colorActive)" 
                    strokeWidth={4} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-8">
            <div className="tc-card bg-white">
              <div className="tc-label mb-6">Resources by Category</div>
              <div className="space-y-5">
                {Object.entries(data?.resources_by_category || {}).slice(0, 5).map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-[10px] font-black mb-1">
                      <span>{cat.replace(/_/g, " ")}</span>
                      <span>{count} Unt</span>
                    </div>
                    <div className="h-1 w-full bg-[var(--bone-alt)]">
                      <div className="h-full bg-[var(--ink)]" style={{ width: `${Math.min(100, (count / 50) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="tc-card">
              <div className="tc-label mb-6">Operational Pulse</div>
              <div className="space-y-3">
                {logs.slice(0, 4).map(l => (
                   <div key={l.id} className="p-2 border-b border-[var(--border)] flex justify-between items-center group cursor-pointer" onClick={() => navigate(`/needs/${l.id}`)}>
                      <div className="text-[12px] font-bold group-hover:text-[var(--signal-red)] transition-colors line-clamp-1">{l.title}</div>
                      <div className="font-mono text-[9px] opacity-40">{new Date(l.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                   </div>
                ))}
                <Link to="/requests" className="block text-center text-[10px] font-black mt-4 text-[var(--signal-red)] hover:underline">Full Sitrep Ledger »</Link>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <h2 className="font-heading text-2xl font-black tracking-tight">Live Dispatch</h2>
          
          <div className="tc-card p-0 bg-[var(--bone-alt)] divide-y divide-[var(--border)] overflow-hidden border-2 border-[var(--ink)]">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-white transition-colors cursor-pointer group" onClick={() => navigate(`/needs/${log.id}`)}>
                <div className="flex justify-between text-[8px] font-mono text-xs text-[var(--ink-muted)] tracking-wider">
                  <span>Ref: {log.id.slice(-6)}</span>
                  <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="text-sm font-black group-hover:text-[var(--signal-red)] leading-tight">{log.title}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${log.urgency >= 4 ? 'bg-[var(--signal-red)]' : 'bg-gray-400'}`} />
                    <span className="text-[9px] font-mono text-[var(--ink-soft)]">{log.status}</span>
                  </div>
                  <div className={`px-2 py-0.5 text-[8px] font-bold ${log.urgency >= 4 ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>U{log.urgency}</div>
                </div>
              </div>
            ))}
            <button onClick={() => navigate("/analytics")} className="w-full py-4 text-[10px] font-black tracking-[0.2em] bg-[var(--ink)] text-white hover:bg-[#333] transition-all">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
