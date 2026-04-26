import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MagnifyingGlass, Funnel, Scan, FileCsv, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TableRowSkeleton } from "@/components/SkeletonLoader";
import { useAuth } from "@/context/AuthContext";

export default function NeedsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20; // 🏛️ Strategy 6: Aggressive Pagination (20 per page)

  // 🏛️ Strategy 3: React Query (Automatic Caching + Staletime)
  // 🏛️ Strategy 13: Poor Man's Persistence (0 cost, no library)
  const queryKey = ['needs', status, category, page];
  const { data: needs = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const q = new URLSearchParams();
      if (status) q.append("status", status);
      if (category) q.append("category", category);
      q.append("skip", page * limit);
      q.append("limit", limit);
      q.append("projection", "short");
      const r = await api.get(`/needs?${q.toString()}`);
      
      // Save to stealth cache
      localStorage.setItem(`cache_${JSON.stringify(queryKey)}`, JSON.stringify(r.data));
      return r.data;
    },
    // Load from stealth cache if available
    placeholderData: () => {
      const cached = localStorage.getItem(`cache_${JSON.stringify(queryKey)}`);
      return cached ? JSON.parse(cached) : undefined;
    }
  });

  // 🏛️ Strategy 5: WebSocket Invalidation (Live Update Sync)
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['needs'] });
    };
    window.addEventListener('janrakshak-live-update', handleUpdate);
    return () => window.removeEventListener('janrakshak-live-update', handleUpdate);
  }, [queryClient]);

  const reprioritize = async () => {
    const t = toast.loading("Recalculating Operational Priorities...");
    try { 
      await api.post("/admin/re-prioritize"); 
      toast.success("Priorities Synchronized", { id: t }); 
      refetch(); 
    }
    catch { toast.error("Admin authorization required", { id: t }); }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm("Confirm deletion? This cannot be undone.")) return;
    try {
      await api.delete(`/needs/${id}`);
      toast.success("Request archived");
      refetch();
    } catch {
      toast.error("Failed to delete request");
    }
  };

  const claimNeed = async (id) => {
    const t = toast.loading("Claiming Mission...");
    try {
      await api.post(`/needs/${id}/claim`);
      toast.success("Mission Claimed", { id: t });
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Claim failed", { id: t });
    }
  };

  const filtered = needs.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="needs-page">
      <div className="pb-2">
        <h1 className="font-heading text-4xl font-black uppercase tracking-tighter leading-none text-[var(--ink)]">
          Requests
        </h1>
      </div>

      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] flex items-center h-14 group transition-all hover:border-[var(--ink-muted)]">
          <div className="w-14 h-full flex items-center justify-center border-r-2 border-[var(--border)] bg-[var(--bone-alt)] group-focus-within:bg-[var(--ink-soft)] group-focus-within:text-white transition-colors">
            <MagnifyingGlass size={20} weight="bold" />
          </div>
          <input 
            type="text" 
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-xs font-bold text-[var(--ink)] placeholder:text-[var(--ink-muted)] placeholder:font-normal tracking-wider" 
            placeholder="Search entries..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] h-14 overflow-hidden transition-all hover:border-[var(--ink-muted)]">
          <div className="border-r-2 border-[var(--border)] flex items-center">
            <select className="w-full bg-transparent text-[10px] font-black uppercase py-4 px-4 outline-none cursor-pointer hover:bg-[var(--bone-alt)] transition-colors" value={status} onChange={(e)=>{setStatus(e.target.value); setPage(0);}}>
              <option value="">Status: All</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">Active</option>
              <option value="completed">Resolved</option>
            </select>
          </div>
          <div className="flex items-center">
            <select className="w-full bg-transparent text-[10px] font-black uppercase py-4 px-4 outline-none cursor-pointer hover:bg-[var(--bone-alt)] transition-colors" value={category} onChange={(e)=>{setCategory(e.target.value); setPage(0);}}>
              <option value="">Sector: All</option>
              <option value="food">Food Supply</option>
              <option value="medical">Medical Gear</option>
              <option value="shelter">Shelter Info</option>
              <option value="blood_donation">Blood Ops</option>
              <option value="disaster_relief">Relief Effort</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 h-14">
          <div className="flex-1 bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] flex items-center justify-around h-full transition-all hover:border-[var(--ink-muted)]">
            <button className="flex-1 h-full flex items-center justify-center hover:bg-[var(--bone-alt)] text-[var(--ink)] transition-colors" onClick={reprioritize} title="Recalculate">
              <Funnel size={22} weight="bold" />
            </button>
          </div>
          <Link to="/needs/new" className="bg-[var(--signal-red)] text-white border-2 border-[var(--signal-red)] px-6 flex items-center justify-center font-black uppercase text-[11px] tracking-tighter shadow-[4px_4px_0px_rgba(230,57,70,0.2)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
            + New
          </Link>
        </div>
      </div>

      <div className="bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] overflow-x-auto transition-all">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--bone-alt)] border-b-2 border-[var(--border)]">
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Prio</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Operation Details</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Sector</th>
              <th className="py-2.5 px-4 text-center text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Urg</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Status</th>
              <th className="py-2.5 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]/50">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => <TableRowSkeleton key={i} />)
            ) : filtered.map((n) => (
              <tr 
                key={n.id} 
                className="hover:bg-[var(--bone-alt)]/30 border-b border-[var(--ink)]/5 last:border-0 transition-colors cursor-pointer group"
                onClick={(e) => {
                  if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                    window.location.href = `/needs/${n.id}`;
                  }
                }}
              >
                <td className="py-2.5 px-4 font-mono font-bold text-[var(--signal-red)] text-sm">
                  {/* Ensure priority is out of 100, fallback to calculated if low */}
                  {Math.max(Math.round(n.priority_score || n.priority || 0), (n.urgency * 15))}
                </td>
                <td className="py-2.5 px-4 font-heading group-hover:text-[var(--signal-red)] transition-colors">
                  <span className="font-semibold text-[var(--ink)] text-[12px] whitespace-nowrap">{n.title}</span>
                </td>
                <td className="py-2.5 px-4 text-[10px] font-medium uppercase text-[var(--ink-soft)] tracking-tight">
                  {n.category.replace(/_/g, " ")}
                </td>
                <td className="py-2.5 px-4 text-center flex items-center justify-center gap-1">
                  <span className={`px-1.5 py-0.5 font-bold text-[9px] ${
                    n.urgency >= 4 ? "bg-[var(--signal-red)] text-white" : "border border-[var(--ink)]/10 text-[var(--ink-soft)]"
                  }`}>
                    U{n.urgency}
                  </span>
                  {n.ai_escalated && (
                    <span className="bg-[var(--high)] text-white px-1.5 py-0.5 font-bold text-[8px] animate-pulse">
                      AI Escalated
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-4">
                  <div className={`px-2 py-0.5 text-[9px] font-bold uppercase text-center border border-[var(--ink)]/20 ${
                    n.status === "completed" ? "bg-green-600/90 text-white" : 
                    n.status === "pending" ? "bg-amber-400 text-[var(--ink)]" : 
                    "bg-blue-600/90 text-white"
                  }`}>
                    {n.status.replace(/_/g, " ")}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right flex items-center justify-end gap-2">
                  <Link to={`/needs/${n.id}`} className="bg-[var(--ink-soft)] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-tight shadow-[2px_2px_0px_rgba(42,61,49,0.2)]">
                    View
                  </Link>
                  {user?.role === 'volunteer' && n.status === 'pending' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); claimNeed(n.id); }} 
                      className="bg-green-600 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-tight shadow-[2px_2px_0px_rgba(22,163,74,0.2)]"
                    >
                      Claim
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button onClick={(e) => { e.stopPropagation(); deleteRequest(n.id); }} className="bg-[var(--signal-red)] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-tight shadow-[2px_2px_0px_rgba(230,57,70,0.2)]">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🏛️ Strategy 6: Pagination Navigator */}
      <div className="flex items-center justify-between font-mono text-[10px] font-black tracking-widest">
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="p-3 border-2 border-[var(--ink)] disabled:opacity-30 hover:bg-[var(--bone-alt)] active:bg-[var(--ink)] active:text-white transition-all"
          >
            <CaretLeft weight="bold" size={16} />
          </button>
          <div className="px-4 py-2 border-2 border-[var(--ink)] bg-[var(--bone-alt)]">
            Page {page + 1}
          </div>
          <button 
            disabled={needs.length < limit}
            onClick={() => setPage(p => p + 1)}
            className="p-3 border-2 border-[var(--ink)] disabled:opacity-30 hover:bg-[var(--bone-alt)] active:bg-[var(--ink)] active:text-white transition-all"
          >
            <CaretRight weight="bold" size={16} />
          </button>
        </div>
        <div className="opacity-40 tracking-tighter">Navigation / Index: {page}</div>
      </div>
    </div>
  );
}
