import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Sparkle, MapPin } from "@phosphor-icons/react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Tactical Marker Icon
const tacticalIcon = L.divIcon({
  className: 'tactical-marker',
  html: `<div style="background-color: #E63946; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 4px rgba(230, 57, 70, 0.3);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

export default function NeedDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [need, setNeed] = useState(null);
  const [matches, setMatches] = useState([]);
  const [explain, setExplain] = useState("");
  const [loading, setLoading] = useState(false);

  const [assignedVol, setAssignedVol] = useState(null);

  const load = async () => {
    try {
      const r = await api.get(`/needs/${id}`);
      setNeed(r.data);
      
      if (r.data.status !== 'pending' && r.data.assigned_volunteer_ids?.length > 0) {
        const v = await api.get(`/volunteers/${r.data.assigned_volunteer_ids[0]}`);
        setAssignedVol(v.data);
      } else {
        const m = await api.post(`/matching/suggest/${id}`);
        setMatches(m.data);
        setAssignedVol(null);
      }
    } catch {}
  };

  useEffect(() => { load(); }, [id]);

  const explainMatch = async () => {
    setLoading(true);
    try {
      const r = await api.post(`/matching/explain/${id}`);
      setExplain(r.data.recommendation);
    } catch { toast.error("AI unavailable"); }
    finally { setLoading(false); }
  };

  const autoAssign = async () => {
    try {
      await api.post(`/matching/auto-assign/${id}`);
      toast.success("Auto-assigned");
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const claimNeed = async () => {
    const t = toast.loading("Processing Tactical Claim...");
    try {
      await api.post(`/needs/${id}/claim`);
      toast.success("Mission Claimed: Operation Active", { id: t });
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Claim failed", { id: t });
    }
  };

  const manualAssign = async (vid) => {
    try {
      await api.patch(`/needs/${id}`, { status: "assigned", assigned_volunteer_ids: [vid] });
      toast.success("Assigned");
      load();
    } catch { toast.error("Requires admin/field_worker"); }
  };

  const markComplete = async () => {
    try {
      await api.patch(`/needs/${id}`, { status: "completed" });
      toast.success("Marked complete"); load();
    } catch { toast.error("Failed"); }
  };

  const deleteNeed = async () => {
    if (!window.confirm("TERMINATE MISSION? Action is irreversible.")) return;
    try {
      await api.delete(`/needs/${id}`);
      toast.success("Mission Terminated");
      window.location.href = "/needs";
    } catch { toast.error("Failed to terminate mission"); }
  };

  if (!need) return <div className="p-8 font-mono">LOADING...</div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6" data-testid="need-detail-page">
      {/* 01: Mission Profile Header */}
      <div className="bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] p-4 md:p-6 transition-all hover:border-[var(--ink-muted)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-[var(--ink-soft)] text-white text-[9px] font-black px-2 py-0.5 tracking-widest">Mission ID</span>
              <span className="text-[10px] font-mono font-bold text-[var(--ink-soft)]">{need.id?.toUpperCase() || "N/A"}</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tighter leading-none text-[var(--ink)]">
              {need.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className={`px-3 py-1.5 border-2 border-[var(--border)] text-[10px] font-black flex items-center gap-2 shadow-[2px_2px_0px_var(--bone-alt)] ${need.urgency >= 4 ? "bg-[var(--signal-red)] text-white border-[var(--signal-red)] shadow-[2px_2px_0px_rgba(230,57,70,0.2)]" : "bg-white text-[var(--ink)]"}`}>
                Urgency: S{need.urgency}
              </div>
              <div className="px-3 py-1.5 border-2 border-[var(--border)] bg-[var(--bone-alt)] text-[var(--ink)] text-[10px] font-black shadow-[2px_2px_0px_var(--bone-alt)]">
                Sector: {(need.category || "other").replace(/_/g, " ")}
              </div>
              <div className="px-3 py-1.5 border-2 border-[var(--border)] bg-[var(--ink-soft)] text-white text-[10px] font-black shadow-[2px_2px_0px_var(--bone-alt)]">
                Status: {need.status}
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--bone-alt)] border-2 border-[var(--border)] p-4 flex flex-col items-center justify-center min-w-[140px] shadow-[4px_4px_0px_var(--bone-alt)]">
            <div className="text-[9px] font-black uppercase text-[var(--ink-soft)] tracking-widest mb-1 text-center">Priority Score</div>
            <div className="font-heading text-6xl font-black text-[var(--signal-red)] tabular-nums leading-none">
              {Math.round(need.priority_score)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Intelligence & Operations (Col Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Intelligence Modules */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Affected', val: need.people_affected || need.population || "NR", icon: 'POP' },
              { label: 'Severity', val: `S${need.severity || 1}`, icon: 'LVL' },
              { label: 'Weather', val: need.weather_factor || need.weather_code || "W1", icon: 'ENV' },
              { label: 'Source', val: (need.source || "Archive").replace(/_/g, ' '), icon: 'SRC' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border-2 border-[var(--border)] p-3 shadow-[4px_4px_0px_var(--bone-alt)] group hover:bg-[var(--bone-alt)] transition-colors hover:border-[var(--ink-soft)]">
                <div className="text-[9px] font-black text-[var(--ink-soft)] tracking-widest border-b border-[var(--border)] pb-1 mb-2 flex justify-between">
                  {stat.label}
                  <span className="opacity-30 tracking-widest">{stat.icon}</span>
                </div>
                <div className="text-2xl font-black text-[var(--ink)] truncate">{stat.val}</div>
              </div>
            ))}
          </div>

          {/* Detailed Intelligence Module */}
          <div className="bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] flex flex-col transition-all hover:border-[var(--ink-muted)] overflow-hidden">
            <div className="border-b-2 border-[var(--border)] bg-[var(--bone-alt)] px-4 py-2 flex justify-between items-center">
              <span className=" text-[10px] font-black tracking-widest text-[var(--ink-soft)]">Situation Report</span>
              <div className="flex gap-1">
                {(need.vulnerability || []).map(v => (
                  <span key={v} className="bg-[var(--signal-red)] text-white text-[8px] font-black px-2 py-0.5">{v}</span>
                ))}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-[10px] font-black text-[var(--ink-muted)] mb-2 tracking-widest">Description</h3>
              <p className="text-base font-medium text-[var(--ink)] leading-relaxed mb-8">
                {need.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[var(--border)]">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-[var(--ink-muted)] mb-2 tracking-widest flex items-center gap-2">
                    <MapPin size={14} weight="fill" className="text-[var(--signal-red)]" />
                    Geospatial Pinpoint
                  </h3>
                  <div className="h-[200px] w-full border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] relative overflow-hidden group">
                    <MapContainer 
                      center={[need.location.lat, need.location.lng]} 
                      zoom={13} 
                      scrollWheelZoom={false}
                      className="h-full w-full z-0"
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[need.location.lat, need.location.lng]} icon={tacticalIcon}>
                        <Popup>
                          <div className="font-mono text-[10px] font-bold">
                            Target: {need.title}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                    <div className="absolute bottom-2 right-2 z-[400] bg-white border border-[var(--border)] px-2 py-1 text-[8px] font-bold font-mono tracking-tighter shadow-sm opacity-80">
                      LAT: {need.location.lat.toFixed(4)} / LNG: {need.location.lng.toFixed(4)}
                    </div>
                  </div>
                  {need.location.address && <div className="text-[10px] opacity-60 italic font-medium px-1">📍 {need.location.address}</div>}
                </div>
                {need.evidence_urls?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black text-[var(--ink-muted)] mb-2 tracking-widest">Field Evidence ({need.evidence_urls.length})</h3>
                    <div className="flex gap-2 flex-wrap">
                      {need.evidence_urls.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer" className="group">
                          <img src={u} alt="evidence" className="w-16 h-16 object-cover border-2 border-[var(--border)] shadow-[2px_2px_0px_var(--bone-alt)] group-hover:shadow-none transition-all" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Command Buttons Module */}
          <div className="bg-[var(--bone-alt)] border-2 border-[var(--border)] p-1 shadow-[4px_4px_0px_var(--bone-alt)] grid grid-cols-4 gap-1">
            <button 
              className="bg-[var(--signal-red)] text-white border-2 border-[var(--signal-red)] px-1 py-3 font-black text-[9px] tracking-tighter hover:bg-red-500 active:translate-y-1 transition-all shadow-[2px_2px_0px_rgba(230,57,70,0.1)] whitespace-nowrap overflow-hidden text-ellipsis" 
              onClick={autoAssign}
            >
              Auto-Assign
            </button>
            <button 
              className="bg-white text-[var(--ink)] border-2 border-[var(--border)] px-1 py-3 font-black text-[9px] tracking-tighter hover:bg-[var(--bone)] active:translate-y-1 transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.02)] whitespace-nowrap overflow-hidden text-ellipsis" 
              onClick={explainMatch} 
              disabled={loading}
            >
              {loading ? "..." : "AI Assist"}
            </button>
            {need.status !== "completed" ? (
              <button 
                className="bg-white text-[var(--ink)] border-2 border-[var(--border)] px-1 py-3 font-black text-[9px] tracking-tighter hover:bg-[var(--bone-alt)] active:translate-y-1 transition-all whitespace-nowrap overflow-hidden text-ellipsis" 
                onClick={markComplete}
              >
                Close
              </button>
            ) : (
              <div className="bg-[var(--bone-alt)] border-2 border-dashed border-[var(--border)] px-1 py-3 font-black text-[9px] text-center opacity-40">
                Closed
              </div>
            )}
            <button 
              className="bg-[var(--signal-red)] text-white border-2 border-[var(--signal-red)] px-1 py-3 font-black text-[9px] tracking-tighter hover:bg-red-700 active:translate-y-1 transition-all shadow-[2px_2px_0px_rgba(230,57,70,0.2)] whitespace-nowrap overflow-hidden text-ellipsis" 
              onClick={deleteNeed}
            >
              Terminate
            </button>
          </div>
          
          {user?.role === 'volunteer' && need.status === 'pending' && (
            <button 
              className="w-full bg-green-600 text-white border-2 border-green-700 px-6 py-4 font-black text-xs tracking-widest hover:bg-green-500 active:translate-y-1 transition-all shadow-[4px_4px_0px_rgba(22,163,74,0.2)] mt-2" 
              onClick={claimNeed}
            >
              Claim Request
            </button>
          )}

          {explain && (
            <div className="bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-[var(--bone-alt)] border-b border-[var(--border)] px-4 py-2 text-[9px] font-black tracking-widest text-[var(--ink-soft)]">
                AI Matching Rationale
              </div>
              <div className="p-6">
                <pre className="text-sm whitespace-pre-wrap font-body leading-relaxed text-[var(--ink)] italic">
                  {explain}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Asset Matching (Col Span 4) */}
        <div className="lg:col-span-4 bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] transition-all hover:border-[var(--ink-muted)]">
          <div className="bg-[var(--bone-alt)] border-b-2 border-[var(--border)] px-4 py-3">
            <h2 className="text-[11px] font-black tracking-tighter flex items-center justify-center gap-2">
              {need.status === 'pending' ? 'Top Candidates' : 'Assigned Operative'}
              <span className="text-[9px] bg-[var(--ink-soft)] text-white px-2 py-0.5">
                {need.status === 'pending' ? 'Match Engine' : 'Tactical Dossier'}
              </span>
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {need.status !== 'pending' && assignedVol ? (
              <div className="border-2 border-[var(--ink)] p-4 bg-[var(--bone-alt)] shadow-[4px_4px_0px_var(--ink)]">
                <div className="flex items-center gap-4 mb-4 pb-2 border-b border-[var(--ink)]">
                  <div className="w-12 h-12 bg-white border-2 border-[var(--ink)] flex items-center justify-center font-black">
                    {assignedVol.name[0]}
                  </div>
                  <div>
                    <div className="font-black text-sm">{assignedVol.name}</div>
                    <div className="text-[10px] font-mono opacity-60">ID: {assignedVol.id.split('-')[0]}</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[10px] font-black text-[var(--signal-red)]">
                    <span>Tactical Status</span>
                    <span>{assignedVol.availability}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black">
                    <span>Trust Index</span>
                    <span>{assignedVol.trust_score}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black">
                    <span>Transport</span>
                    <span>{assignedVol.transport}</span>
                  </div>
                </div>

                <Link 
                  to={`/volunteers/${assignedVol.id}`}
                  className="w-full block bg-[var(--ink)] text-white text-[10px] font-black py-3 text-center hover:bg-[var(--ink-muted)] transition-all"
                >
                  VIEW FULL RECORD
                </Link>
              </div>
            ) : (
              <>
                {matches.length === 0 ? (
                  <div className="tc-card bg-[var(--bone-alt)] text-center py-10 opacity-60">
                    No assets detected in sector
                  </div>
                ) : (
                  matches.map(v => (
                    <div key={v.id} className="border-2 border-[var(--border)] p-4 hover:border-[var(--ink-muted)] transition-colors group bg-white shadow-sm hover:shadow-md">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
                        <div className="font-black text-sm tracking-tight">{v.name}</div>
                        <div className="font-mono font-black text-2xl text-[var(--signal-red)] leading-none truncate">
                          {v.match_score} <span className="text-[8px] text-[var(--ink-soft)] block">SCORE</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {[
                          { label: 'Proximity', val: `${v.distance_km}km`, percent: Math.max(10, 100 - (v.distance_km * 2)), color: 'bg-[var(--ink-soft)]' },
                          { label: 'Trust Index', val: Math.round(v.trust_score), percent: v.trust_score, color: 'bg-blue-600' },
                          { label: 'Mobility', val: v.transport?.charAt(0).toUpperCase() + v.transport?.slice(1) || "N/A", percent: v.transport && v.transport !== 'none' ? 90 : 20, color: 'bg-amber-500' },
                        ].map(bar => (
                          <div key={bar.label} className="space-y-1">
                            <div className=" flex items-center justify-between text-[9px] font-black tracking-tight text-[var(--ink-soft)]">
                              <span>{bar.label}</span>
                              <span>{bar.val}</span>
                            </div>
                            <div className="h-2 bg-[var(--bone-alt)] border border-[var(--border)] p-[1px]">
                              <div className={`h-full ${bar.color} transition-all duration-1000`} style={{ width: `${bar.percent}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        className="w-full mt-6 bg-white text-[var(--ink)] border-2 border-[var(--border)] py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--ink)] hover:text-white transition-all active:translate-y-1"
                        onClick={() => manualAssign(v.id)}
                      >
                        OVERRIDE & ASSIGN ASSET
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
