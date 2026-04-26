import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { User, IdentificationCard } from "@phosphor-icons/react";

export default function VolunteersPage() {
  const [vols, setVols] = useState([]);
  const [availability, setAvailability] = useState("");

  const load = async () => {
    const q = availability ? `?availability=${availability}` : "";
    const r = await api.get(`/volunteers${q}`);
    setVols(r.data);
  };
  useEffect(() => { load(); }, [availability]);

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="volunteers-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="tc-label">Roster</div>
          <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Volunteers</h1>
        </div>
        <select className="tc-select max-w-xs" value={availability} onChange={(e)=>setAvailability(e.target.value)} data-testid="filter-availability">
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="off_duty">Off Duty</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vols.map(v => (
          <Link 
            key={v.id} 
            to={`/volunteers/${v.id}`}
            className="tc-card block group hover:border-[var(--ink-soft)] transition-all" 
            data-testid={`vol-card-${v.id}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-heading font-bold text-lg group-hover:text-[var(--signal-red)] transition-colors">{v.name}</div>
                <div className="tc-label">{v.transport.toUpperCase()} · {v.working_radius_km}KM RADIUS</div>
              </div>
              <div className="text-right">
                <div className="tc-label">Trust</div>
                <div className="font-mono font-bold text-2xl text-[var(--signal-red)]">{Math.round(v.trust_score)}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-1 flex-wrap">
              {v.skills.slice(0, 4).map(s => <span key={s} className="tc-badge tc-badge-outl">{s}</span>)}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className={`tc-badge ${v.availability === "available" ? "tc-badge-res" : v.availability === "busy" ? "tc-badge-high" : "tc-badge-outl"}`}>
                {v.availability}
              </span>
              <span className="font-mono text-[var(--ink-soft)]">{v.completed_missions} missions</span>
            </div>
          </Link>
        ))}
        {vols.length === 0 && <div className="col-span-full py-8 text-center font-mono text-[var(--ink-soft)]">NO VOLUNTEERS</div>}
      </div>
    </div>
  );
}
