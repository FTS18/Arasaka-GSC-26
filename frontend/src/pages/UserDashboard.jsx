import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const Spark = ({ color }) => {
  const data = [...Array(12)].map((_, i) => ({ val: Math.floor(Math.random() * 20) + 10 }));
  return (
    <div className="tc-sparkline-container -mx-6 -mb-6 h-16 opacity-50">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey="val" stroke={color} fill={color} fillOpacity={0.05} strokeWidth={1} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const Stat = ({ label, value, variant, icon: Icon }) => (
  <div className="tc-card overflow-hidden relative group hover:border-[var(--signal-red)] transition-colors">
    <div className="flex justify-between items-start relative z-10">
      <div className="tc-label">{label}</div>
      {Icon && <Icon size={16} className="text-[var(--ink-soft)] group-hover:text-[var(--signal-red)]" />}
    </div>
    <div className="font-mono font-bold text-4xl mt-3 tracking-tight relative z-10">{value}</div>
    <Spark color={variant === "crit" ? "var(--signal-red)" : "var(--ink-soft)"} />
  </div>
);

const StepAction = ({ status }) => {
  const steps = ["pending", "assigned", "in_progress", "completed"];
  const currentIdx = steps.indexOf(status);
  
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((s, idx) => (
        <React.Fragment key={s}>
          <div 
            className={`h-1.5 flex-1 rounded-full ${
              idx <= currentIdx 
                ? s === "completed" ? "bg-green-500" : "bg-[var(--signal-red)]" 
                : "bg-[var(--border)]"
            }`}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [myNeeds, setMyNeeds] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [allNeeds, dashboardStats] = await Promise.all([
          api.get("/needs?limit=300"),
          api.get("/dashboard/stats"),
        ]);
        const mine = (allNeeds.data || []).filter((n) => n.created_by === user?.id);
        setMyNeeds(mine);
        setStats(dashboardStats.data || null);
      } catch {
        toast.error("Failed to load user dashboard");
      }
    };

    load();
    const intervalId = setInterval(load, 30000);
    return () => clearInterval(intervalId);
  }, [user?.id]);

  const pendingCount = useMemo(() => myNeeds.filter((n) => ["pending", "assigned", "in_progress"].includes(n.status)).length, [myNeeds]);
  const completedCount = useMemo(() => myNeeds.filter((n) => n.status === "completed").length, [myNeeds]);

  if (!stats) return <div className="p-8 font-mono text-xs uppercase tracking-widest animate-pulse">Loading community data...</div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-full overflow-x-hidden" data-testid="user-dashboard-page">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[var(--ink)] text-[var(--bone)] p-8 md:p-12 rounded-sm" role="banner">
        <div className="relative z-10 max-w-3xl">
          <h1 className="font-heading text-5xl md:text-6xl font-black mb-4 tracking-tighter leading-none" id="main-title">
            {t("help_is_near") || "Help is Near."}
          </h1>
          <p className="text-xl md:text-2xl text-[var(--bone-alt)] mb-8 font-bold leading-tight opacity-90">
            {t("app_name")} {t("user_hero_sub") || "connects you directly with field volunteers and relief resources."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 text-center">
            <Link to="/needs/new" className="btn-primary py-4 px-8 text-lg font-black tracking-tighter" aria-label={t("help_request")}>
              + {t("i_need_help") || "I NEED HELP NOW"}
            </Link>
            <button className="btn-hard border-[var(--ink-soft)] text-white hover:bg-white/10 py-4 px-8 text-lg font-bold" aria-label={t("view_safety_zones")}>
               {t("safety_zones") || "VIEW SAFETY ZONES"}
            </button>
          </div>
        </div>
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
          <div className="absolute inset-0 border-r border-b border-[var(--signal-red)] transform rotate-12 scale-150" />
          <div className="absolute inset-x-0 top-1/2 h-1 border-t border-[var(--signal-red)]" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="Incident Summary">
        <Stat label={t("critical_needs")} value={stats?.critical_needs || 0} variant="crit" />
        <Stat label={t("active_needs")} value={stats?.active_needs || 0} />
        <Stat label={t("resolved")} value={stats?.resolved_needs || 0} />
        <Stat label={t("volunteers_available")} value={stats?.active_volunteers || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-full overflow-hidden">
        {/* Active Requests */}
        <div className="lg:col-span-8 space-y-6 min-w-0" role="region" aria-labelledby="active-req-heading">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-black tracking-tight" id="active-req-heading">{t("active_needs")}</h2>
            <Link to="/needs" className="tc-label hover:text-[var(--signal-red)] transition-colors">{t("history_view")} →</Link>
          </div>
          
          <div className="grid gap-4">
            {myNeeds.filter(n => n.status !== "completed").slice(0, 3).map((n) => (
              <div key={n.id} className="tc-card border-l-4 border-l-[var(--signal-red)]">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-heading font-bold text-xl">{n.title}</div>
                  <div className={`tc-badge ${n.urgency >= 4 ? "tc-badge-crit" : "tc-badge-outl"}`}>U{n.urgency}</div>
                </div>
                <div className="text-sm text-[var(--ink-soft)] font-mono">{n.category.replace(/_/g, " ")} · REPORTED {new Date(n.created_at).toLocaleTimeString()}</div>
                
                <StepAction status={n.status} />
                
                <div className="flex justify-between mt-3 text-[10px] font-bold font-mono text-[var(--ink-muted)] tracking-widest uppercase">
                  <span className={n.status === "pending" ? "text-[var(--signal-red)]" : ""}>Intake</span>
                  <span className={n.status === "assigned" ? "text-[var(--signal-red)]" : ""}>Assigned</span>
                  <span className={n.status === "in_progress" ? "text-[var(--signal-red)]" : ""}>In Transit</span>
                  <span className={n.status === "completed" ? "text-green-500" : ""}>Resolved</span>
                </div>
              </div>
            ))}
            {myNeeds.filter(n => n.status !== "completed").length === 0 && (
              <div className="tc-card border-dashed bg-transparent flex flex-col items-center justify-center py-12 text-[var(--ink-soft)]">
                <div className="font-mono text-sm opacity-50 uppercase tracking-widest">No active requests found</div>
                <Link to="/needs/new" className="mt-4 text-[var(--signal-red)] font-bold decoration-2 underline underline-offset-4">Report an issue now</Link>
              </div>
            )}
          </div>
        </div>

        {/* Safety Bulletin */}
        <div className="md:col-span-4 space-y-6">
          <h2 className="font-heading text-2xl font-black tracking-tight">Safety Bulletin</h2>
          <div className="tc-card bg-[var(--bone-alt)] divide-y divide-[var(--border)] p-0">
            <div className="p-4">
              <div className="tc-label text-[var(--signal-red)] font-bold mb-1">STORM ALERT</div>
              <div className="text-sm font-bold">Heavy rain expected in East District within 2 hours. Seek shelter.</div>
              <div className="text-[10px] font-mono text-[var(--ink-muted)] mt-2">UPDATED 10:45</div>
            </div>
            <div className="p-4">
              <div className="tc-label mb-1">RELIEF UPDATE</div>
              <div className="text-sm">Clean water distribution active at Central Hub. Bring containers.</div>
              <div className="text-[10px] font-mono text-[var(--ink-muted)] mt-2">UPDATED 09:12 Z</div>
            </div>
            <div className="p-4">
              <div className="tc-label mb-1">RESOURCE NOTICE</div>
              <div className="text-sm">Medical team arriving at District 4 community center tomorrow morning.</div>
              <div className="text-[10px] font-mono text-[var(--ink-muted)] mt-2">UPDATED 08:00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
