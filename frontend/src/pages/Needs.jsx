import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function NeedsPage() {
  const [needs, setNeeds] = useState([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const load = async () => {
    const q = new URLSearchParams();
    if (status) q.append("status", status);
    if (category) q.append("category", category);
    const r = await api.get(`/needs?${q.toString()}`);
    setNeeds(r.data);
  };

  useEffect(() => { load(); }, [status, category]);

  const reprioritize = async () => {
    try { await api.post("/needs/reprioritize"); toast.success("Re-prioritized"); load(); }
    catch { toast.error("Requires admin/field worker role"); }
  };

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="needs-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="tc-overline">Need Management</div>
          <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Requests</h1>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={reprioritize} data-testid="reprioritize-btn">Re-prioritize</button>
          <Link to="/needs/new" className="btn-primary" data-testid="needs-new-btn">+ New Request</Link>
        </div>
      </div>

      <div className="tc-card">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="tc-label">Status</label>
            <select className="tc-select" value={status} onChange={(e)=>setStatus(e.target.value)} data-testid="filter-status">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="tc-label">Category</label>
            <select className="tc-select" value={category} onChange={(e)=>setCategory(e.target.value)} data-testid="filter-category">
              <option value="">All</option>
              <option value="food">Food</option>
              <option value="medical">Medical</option>
              <option value="shelter">Shelter</option>
              <option value="education">Education</option>
              <option value="sanitation">Sanitation</option>
              <option value="blood_donation">Blood donation</option>
              <option value="disaster_relief">Disaster relief</option>
              <option value="emergency_transport">Emergency transport</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <table className="w-full mt-6 text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left tc-overline">
              <th className="py-2">Score</th>
              <th>Title</th>
              <th>Category</th>
              <th>Urgency</th>
              <th>Affected</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {needs.map((n) => (
              <tr key={n.id} className="border-b border-[var(--border)] hover:bg-[var(--bone-alt)]" data-testid={`need-list-${n.id}`}>
                <td className="py-3 font-mono font-bold text-[var(--signal-red)]">{Math.round(n.priority_score)}</td>
                <td className="font-semibold">{n.title}</td>
                <td><span className="tc-badge tc-badge-outl">{n.category.replace(/_/g, " ")}</span></td>
                <td><span className={`tc-badge ${n.urgency >= 4 ? "tc-badge-crit" : "tc-badge-outl"}`}>U{n.urgency}</span></td>
                <td className="font-mono">{n.people_affected}</td>
                <td><span className={`tc-badge ${n.status === "completed" ? "tc-badge-res" : n.status === "pending" ? "tc-badge-high" : "tc-badge-mon"}`}>{n.status}</span></td>
                <td><Link to={`/needs/${n.id}`} className="btn-ghost text-[10px] px-3 py-1" data-testid={`open-need-${n.id}`}>Open</Link></td>
              </tr>
            ))}
            {needs.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-[var(--ink-soft)] font-mono">NO RESULTS</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
