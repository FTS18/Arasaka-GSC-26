import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Stat = ({ label, value }) => (
  <div className="tc-card">
    <div className="overline">{label}</div>
    <div className="font-mono font-bold text-3xl mt-3 tracking-tight">{value}</div>
  </div>
);

export default function UserDashboardPage() {
  const { user } = useAuth();
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

  if (!stats) return <div className="p-8 font-mono text-sm">LOADING COMMUNITY DASHBOARD...</div>;

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="user-dashboard-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="overline">Community Dashboard</div>
          <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tighter mt-1">Your Social Impact View</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2 max-w-2xl">
            Data-Driven Volunteer Coordination for Social Impact: track your requests, monitor response progress, and see how local volunteer capacity is evolving.
          </p>
        </div>
        <Link to="/needs/new" className="btn-primary">+ Create New Request</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="MY REQUESTS" value={myNeeds.length} />
        <Stat label="MY ACTIVE" value={pendingCount} />
        <Stat label="MY RESOLVED" value={completedCount} />
        <Stat label="VOLUNTEERS AVAILABLE" value={stats.volunteers_available} />
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <section className="md:col-span-8 tc-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="overline">My Requests</div>
              <div className="font-heading text-xl font-bold mt-1">Recent Request Timeline</div>
            </div>
            <Link to="/needs" className="btn-ghost">Browse all needs</Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {myNeeds.slice(0, 10).map((n) => (
              <Link to={`/needs/${n.id}`} key={n.id} className="flex items-start gap-4 py-4 hover:bg-[var(--bone-alt)]">
                <div className="font-mono text-sm text-[var(--ink-soft)] w-24">U{n.urgency}</div>
                <div className="flex-1">
                  <div className="font-heading font-bold text-base">{n.title}</div>
                  <div className="text-xs text-[var(--ink-soft)] mt-1">{n.category.replace(/_/g, " ")} · {n.people_affected} affected</div>
                </div>
                <span className={`tc-badge ${n.status === "completed" ? "tc-badge-res" : n.status === "pending" ? "tc-badge-high" : "tc-badge-mon"}`}>
                  {n.status}
                </span>
              </Link>
            ))}
            {myNeeds.length === 0 && (
              <div className="py-8 text-center text-[var(--ink-soft)] font-mono text-sm">NO REQUESTS YET. CREATE YOUR FIRST REQUEST.</div>
            )}
          </div>
        </section>

        <section className="md:col-span-4 tc-card">
          <div className="overline">Community Pulse</div>
          <div className="font-heading text-xl font-bold mt-1">Local Response Snapshot</div>
          <div className="space-y-3 mt-4 text-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span>Critical needs in network</span>
              <span className="font-mono font-bold text-[var(--signal-red)]">{stats.critical_needs}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span>Active missions</span>
              <span className="font-mono font-bold">{stats.missions_active}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span>Resolved requests</span>
              <span className="font-mono font-bold">{stats.resolved_needs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Average response (hours)</span>
              <span className="font-mono font-bold">{stats.avg_response_hours}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
