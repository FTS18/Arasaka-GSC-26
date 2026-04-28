import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";

// Fixed seed — no shaking on re-render
const SPARK_SEED = [...Array(12)].map((_, i) => ({ val: [18,22,15,28,12,25,20,30,17,24,19,26][i] }));
const Spark = ({ color }) => (
  <div className="tc-sparkline-container -mx-6 -mb-6 h-16 opacity-50">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={SPARK_SEED}>
        <Area type="monotone" dataKey="val" stroke={color} fill={color} fillOpacity={0.05} strokeWidth={1} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

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
  const isCancelled = status === "cancelled";
  const currentIdx = isCancelled ? -1 : steps.indexOf(status);
  
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((s, idx) => (
        <React.Fragment key={s}>
          <div 
            className={`h-1.5 flex-1 rounded-full ${
              isCancelled ? "bg-gray-300 opacity-50" :
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
        const [allNeeds, dashboardStats, bulletinNeeds] = await Promise.all([
          api.get(`/needs?created_by=${user?.id}`),
          api.get("/dashboard/stats"),
          api.get("/needs?limit=3&status=pending"),
        ]);
        setMyNeeds(allNeeds.data || []);
        setStats({ ...(dashboardStats.data || null), bulletin: bulletinNeeds.data || [] });
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

  if (!stats) return (
    <div className="p-4 md:p-8 space-y-12 animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative overflow-hidden bg-[var(--bone-alt)] p-8 md:p-12 border-2 border-[var(--border)] rounded-sm min-h-[300px] flex flex-col justify-center">
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-16 w-1/2" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-14 w-40" />
            <Skeleton className="h-14 w-40" />
          </div>
        </div>
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="tc-card p-6 min-h-[140px] flex flex-col justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-12 w-16" />
            <div className="h-1 w-full bg-[var(--bone-alt)]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Requests Skeletons */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="tc-card p-4 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Community Bulletin Skeletons (Resource Availability) */}
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-8 w-40" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="tc-card p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-1/2" />
                <div className="flex gap-2">
                   <Skeleton className="h-6 w-12" />
                   <Skeleton className="h-6 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-full overflow-x-hidden" data-testid="user-dashboard-page">
      <SEO title={t("dashboard")} description="Citizen portal for reporting critical needs and tracking relief efforts." />
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
            <Link to="/map" className="btn-hard border-[var(--ink-soft)] text-white hover:bg-white/10 py-4 px-8 text-lg font-bold" aria-label={t("view_safety_zones")}>
               {t("safety_zones") || "VIEW SAFETY ZONES"}
            </Link>
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
            <h2 className="font-heading text-2xl font-black tracking-tight" id="active-req-heading">{t("tracker_my_requests")}</h2>
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

        {/* Safety Bulletin — Live from Firestore */}
        <div className="md:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-black tracking-tight">{t("live_status_bulletin")}</h2>
            <div className="tc-badge tc-badge-outl opacity-60 uppercase">{t("active_field_ops")}</div>
          </div>
          <div className="tc-card bg-[var(--bone-alt)] divide-y divide-[var(--border)] p-0 overflow-hidden border-2 border-[var(--border)]">
            {(stats?.bulletin || []).length > 0 ? (
              (stats?.bulletin).map((n) => (
                <Link to={`/needs/${n.id}`} key={n.id} className="block p-4 hover:bg-[var(--bone)] transition-colors group">
                  <div className={`tc-label font-bold mb-1 ${n.urgency >= 4 ? 'text-[var(--signal-red)]' : ''}`}>
                    {n.urgency >= 4 ? 'URGENT · ' : ''}{(n.category || 'other').replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-sm font-black truncate group-hover:text-[var(--signal-red)]">{n.title}</div>
                  <div className="text-[10px] font-mono text-[var(--ink-muted)] mt-1 uppercase tracking-wider">
                    {n.people_affected} IMPACTED · {new Date(n.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-[var(--ink-muted)] opacity-50 space-y-3">
                <Broadcast size={32} weight="thin" />
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-center">No active field alerts</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
