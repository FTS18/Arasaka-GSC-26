import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { 
  User, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle,
  ArrowLeft,
  IdentificationCard
} from "@phosphor-icons/react";

export default function VolunteerDetailPage() {
  const { id } = useParams();
  const [vol, setVol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get(`/volunteers/${id}`);
      setVol(r.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Tactical link broken. Dossier inaccessible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-8 font-mono animate-pulse uppercase">Syncing Operative Dossier...</div>;
  if (error || !vol) return (
    <div className="p-8 space-y-4">
      <div className="font-mono text-[var(--signal-red)] font-bold uppercase">Operational Failure: {error || "Operative not in tactical roster"}</div>
      <Link to="/volunteers" className="inline-block border-2 border-[var(--border)] bg-white px-6 py-2 shadow-[4px_4px_0px_var(--bone-alt)] font-black uppercase text-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
        ← BACK TO ROSTER
      </Link>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6" data-testid="volunteer-detail-page">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link to="/volunteers" className="p-2 border-2 border-[var(--border)] bg-white shadow-[2px_2px_0px_var(--bone-alt)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
          <ArrowLeft size={20} weight="bold" />
        </Link>
        <div className="tc-label">Operative Dossier</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Sidebar (Col Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border-2 border-[var(--border)] shadow-[6px_6px_0px_var(--bone-alt)] p-6 transition-all hover:border-[var(--ink-muted)]">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-[var(--bone-alt)] border-2 border-[var(--border)] flex items-center justify-center rounded-sm shadow-inner overflow-hidden">
                <User size={48} weight="duotone" className="text-[var(--ink-muted)]" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-[var(--ink)]">
                  {vol.name}
                </h1>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className={`tc-badge ${vol.availability === 'available' ? 'tc-badge-res' : 'tc-badge-high'}`}>
                    {vol.availability.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[var(--ink-soft)]">UID: {vol.id.split('-')[0]}</span>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-[var(--border)]">
                <div className="text-[10px] font-black uppercase text-[var(--ink-soft)] tracking-widest mb-4">Tactical Status</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--bone-alt)] p-3 border border-[var(--border)] flex flex-col items-center">
                    <span className="text-[8px] font-bold opacity-40">TRUST SCORE</span>
                    <span className="text-2xl font-black text-[var(--signal-red)] leading-none">{Math.round(vol.trust_score)}</span>
                  </div>
                  <div className="bg-[var(--bone-alt)] p-3 border border-[var(--border)] flex flex-col items-center">
                    <span className="text-[8px] font-bold opacity-40">MISSIONS</span>
                    <span className="text-2xl font-black text-[var(--ink)] leading-none">{vol.completed_missions}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight">
                <Truck size={18} weight="bold" className="text-[var(--ink-muted)]" />
                <span>Transport: {vol.transport}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight">
                <MapPin size={18} weight="bold" className="text-[var(--ink-muted)]" />
                <span>Radius: {vol.working_radius_km} KM</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight">
                <IdentificationCard size={18} weight="bold" className="text-[var(--ink-muted)]" />
                <span>Lang: {vol.languages?.join(', ')}</span>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-[9px] font-black uppercase text-[var(--ink-soft)] tracking-widest mb-3">Skill Certifications</div>
              <div className="flex flex-wrap gap-1.5">
                {vol.skills.map(s => (
                  <span key={s} className="px-2 py-1 bg-[var(--bone-alt)] border border-[var(--border)] text-[9px] font-black uppercase tracking-tight">
                    {s.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Feed (Col Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Mission history */}
          <div className="bg-white border-2 border-[var(--border)] shadow-[6px_6px_0px_var(--bone-alt)] overflow-hidden">
            <div className="bg-[var(--bone-alt)] border-b-2 border-[var(--border)] px-4 py-2 flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--ink-soft)] flex items-center gap-2">
                <ShieldCheck size={14} weight="fill" />
                Service Record (Last 50)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--bone-alt)]/50 border-b border-[var(--border)]">
                    <th className="py-2 px-4 text-[9px] font-black uppercase">Mission ID</th>
                    <th className="py-2 px-4 text-[9px] font-black uppercase">Status</th>
                    <th className="py-2 px-4 text-[9px] font-black uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/50">
                  {vol.missions_history?.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-[10px] font-mono opacity-40">NO MISSIONS LOGGED</td>
                    </tr>
                  ) : (
                    vol.missions_history.map(m => (
                      <tr key={m.id} className="hover:bg-[var(--bone-alt)]/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-[10px] font-bold">{m.id.split('-')[0].toUpperCase()}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 border ${m.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[10px] font-mono">{new Date(m.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Points/Activity Audit */}
          <div className="bg-white border-2 border-[var(--border)] shadow-[6px_6px_0px_var(--bone-alt)] overflow-hidden">
            <div className="bg-[var(--bone-alt)] border-b-2 border-[var(--border)] px-4 py-2 flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--ink-soft)] flex items-center gap-2">
                <Star size={14} weight="fill" />
                Trust Score Audit Trail
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {vol.activity_log?.length === 0 ? (
                <div className="py-8 text-center text-[10px] font-mono opacity-40 uppercase">No recent trust adjustments</div>
              ) : (
                vol.activity_log.map((log, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 border border-[var(--border)] bg-white hover:bg-[var(--bone-alt)]/20 transition-all group">
                    <div className="p-2 bg-[var(--bone-alt)] group-hover:bg-white transition-colors">
                      {log.action.includes('complete') ? <CheckCircle size={16} weight="bold" className="text-green-600" /> : <Clock size={16} weight="bold" className="text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest">{log.action.replace(/_/g, ' ')}</span>
                        <span className="text-[8px] font-mono opacity-50">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-[11px] font-medium text-[var(--ink-muted)]">
                        {log.action === 'mission_completed' ? 'Trust score boosted (+1.5)' : log.action === 'mission_abandoned' ? 'Trust score slashed (-15.0)' : 'System action recorded.'}
                      </div>
                      {log.target && <div className="text-[8px] font-mono mt-1 opacity-40 uppercase">REF: {log.target.split('-')[0]}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
