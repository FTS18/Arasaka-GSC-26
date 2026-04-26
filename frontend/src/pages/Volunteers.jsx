import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { User, IdentificationCard } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

export default function VolunteersPage() {
  const [availability, setAvailability] = useState("");
  const [city, setCity] = useState("");

  const queryKey = ['volunteers', availability, city];
  const { data: vols = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const q = new URLSearchParams();
      if (availability) q.append("availability", availability);
      if (city) q.append("city", city);
      q.append("projection", "short");
      const r = await api.get(`/volunteers?${q.toString()}`);
      
      // Save to stealth cache
      localStorage.setItem(`cache_${JSON.stringify(queryKey)}`, JSON.stringify(r.data));
      return r.data;
    },
    staleTime: 60000, 
    // Load from stealth cache if available
    placeholderData: () => {
      const cached = localStorage.getItem(`cache_${JSON.stringify(queryKey)}`);
      return cached ? JSON.parse(cached) : undefined;
    }
  });

  const cities = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", 
    "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", 
    "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Chandigarh"
  ];

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="volunteers-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="tc-label">Roster</div>
          <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Volunteers</h1>
        </div>
        <div className="flex gap-2">
          <select className="tc-select max-w-xs" value={city} onChange={(e)=>setCity(e.target.value)} data-testid="filter-city">
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="tc-select max-w-xs" value={availability} onChange={(e)=>setAvailability(e.target.value)} data-testid="filter-availability">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => <div key={i} className="tc-card h-48 animate-pulse bg-[var(--bone-alt)]" />)
        ) : vols.map(v => (
          <Link 
            key={v.id} 
            to={`/volunteers/${v.id}`}
            className="tc-card block group hover:border-[var(--ink-soft)] transition-all" 
            data-testid={`vol-card-${v.id}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-heading font-bold text-lg group-hover:text-[var(--signal-red)] transition-colors">{v.name}</div>
                <div className="tc-label">{(v.transport || 'ground').toUpperCase()} · {v.working_radius_km || 10}KM RADIUS</div>
              </div>
              <div className="text-right">
                <div className="tc-label">Trust</div>
                <div className="font-mono font-bold text-2xl text-[var(--signal-red)]">{Math.round(v.trust_score)}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-1 flex-wrap">
              {(v.skills || []).slice(0, 4).map(s => <span key={s} className="tc-badge tc-badge-outl">{s}</span>)}
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
