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

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, n, s] = await Promise.all([
          api.get("/missions"),
          api.get("/needs?limit=20"),
          api.get("/dashboard/stats"),
        ]);
        setMissions(m.data || []);
        setNeeds(n.data || []);
        setStats(s.data || null);
      } catch {
        toast.error("Failed to load volunteer dashboard");
      }
    };

    load();
    const intervalId = setInterval(load, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const myMissions = useMemo(() => {
    return missions.filter((m) => (m.volunteer_ids || []).includes(user?.id));
  }, [missions, user?.id]);

  const actionableNeeds = useMemo(() => {
    const assigned = needs.filter((n) => (n.assigned_volunteer_ids || []).includes(user?.id));
    if (assigned.length > 0) return assigned;
    return needs
      .filter((n) => ["pending", "assigned", "in_progress"].includes(n.status))
      .slice(0, 6);
  }, [needs, user?.id]);

  if (!stats) return <div className="p-8 font-mono text-sm">LOADING VOLUNTEER BRIEF...</div>;

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="volunteer-dashboard-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="overline">Volunteer Console</div>
          <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tighter mt-1">Field Action Board</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2 max-w-2xl">
            Smart Resource Allocation converts scattered community reports into the highest-priority tasks so you can act where impact is greatest.
          </p>
        </div>
        <Link to="/missions" className="btn-primary">Open Missions</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="MY MISSIONS" value={myMissions.length} />
        <Stat label="ACTIONABLE NEEDS" value={actionableNeeds.length} />
        <Stat label="ACTIVE MISSIONS" value={stats.missions_active} />
        <Stat label="VOLUNTEERS ON-CALL" value={stats.volunteers_available} />
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <section className="md:col-span-7 tc-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="overline">Assigned or Priority Queue</div>
              <div className="font-heading text-xl font-bold mt-1">Needs You Can Respond To</div>
            </div>
            <Link to="/needs" className="btn-ghost">View all</Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {actionableNeeds.map((n) => (
              <Link to={`/needs/${n.id}`} key={n.id} className="flex items-start gap-3 py-3 hover:bg-[var(--bone-alt)]">
                <div className="font-mono font-bold text-[var(--signal-red)] w-14">{Math.round(n.priority_score)}</div>
                <div className="flex-1">
                  <div className="font-heading font-bold text-base">{n.title}</div>
                  <div className="text-xs text-[var(--ink-soft)] mt-1">
                    {n.category.replace(/_/g, " ")} · U{n.urgency} · {n.people_affected} affected
                  </div>
                </div>
                <span className="tc-badge tc-badge-high">{n.status}</span>
              </Link>
            ))}
            {actionableNeeds.length === 0 && (
              <div className="py-8 text-center text-[var(--ink-soft)] font-mono text-sm">NO ACTIONABLE NEEDS RIGHT NOW</div>
            )}
          </div>
        </section>

        <section className="md:col-span-5 tc-card">
          <div className="overline">Mission Readiness</div>
          <div className="font-heading text-xl font-bold mt-1">Your Mission Snapshot</div>
          <div className="mt-4 space-y-3">
            {myMissions.slice(0, 5).map((m) => (
              <div key={m.id} className="border border-[var(--border)] p-3">
                <div className="font-mono text-xs text-[var(--ink-soft)]">MISSION {m.id.slice(0, 8)}</div>
                <div className="text-sm mt-1">{m.need_ids.length} need(s) · {m.volunteer_ids.length} volunteer(s)</div>
                <div className="mt-2">
                  <span className={`tc-badge ${m.status === "completed" ? "tc-badge-res" : "tc-badge-high"}`}>{m.status}</span>
                </div>
              </div>
            ))}
            {myMissions.length === 0 && (
              <div className="text-sm text-[var(--ink-soft)]">
                No missions are assigned yet. Stay ready; high-priority needs will appear here as soon as matching is done.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
