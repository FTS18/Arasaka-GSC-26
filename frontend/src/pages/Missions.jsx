import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { GuidanceCompass } from "@/components/GuidanceCompass";

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [proof, setProof] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeCompass, setActiveCompass] = useState(null); // stores mission id

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/missions");
      setMissions(r.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const complete = async (m) => {
    try {
      await api.post(`/missions/${m.id}/complete`, {
        proof_urls: proof.split(",").map(s=>s.trim()).filter(Boolean),
        completion_notes: "Completed via console",
      });
      toast.success("Mission completed. Trust scores updated.");
      setSelected(null); setProof("");
      load();
    } catch { toast.error("Requires admin/field_worker/volunteer"); }
  };

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="missions-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="tc-label">Field Operations</div>
          <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Missions</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          [1, 2, 3, 4].map(i => <CardSkeleton key={i} />)
        ) : (
          <>
            {missions.map(m => (
              <div key={m.id} className="tc-card" data-testid={`mission-card-${m.id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="tc-label">Mission · {(m.id || "").slice(0,8)}</div>
                    <div className="font-heading font-bold text-lg mt-1">{(m.need_ids || []).length} request(s) · {(m.volunteer_ids || []).length} volunteer(s)</div>
                  </div>
                  <span className={`tc-badge ${(m.status || "planned") === "completed" ? "tc-badge-res" : "tc-badge-high"}`}>{m.status || "planned"}</span>
                </div>
                {m.proof_urls?.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {m.proof_urls.map((u,i) => <img key={i} src={u} alt="proof" className="w-20 h-20 object-cover border border-[var(--border)]" />)}
                  </div>
                )}
                {m.completion_notes && <div className="mt-2 text-xs text-[var(--ink-soft)] italic">"{m.completion_notes}"</div>}
                {m.status !== "completed" && (
                  <div className="mt-3 flex gap-2">
                    <button className="btn-hard flex-1" onClick={() => setSelected(m)} data-testid={`complete-btn-${m.id}`}>
                      Mark Complete
                    </button>
                    {m.coordinates && (
                      <button 
                        className={`btn-ghost px-3 ${activeCompass === m.id ? "bg-[var(--high)] text-white" : ""}`}
                        onClick={() => setActiveCompass(activeCompass === m.id ? null : m.id)}
                        title="Toggle Field Guidance"
                      >
                        <span className="material-symbols-outlined">explore</span>
                      </button>
                    )}
                  </div>
                )}
                
                {activeCompass === m.id && m.coordinates && (
                  <div className="mt-4 p-4 border-t border-[var(--border)] bg-[var(--bone)]">
                    <div className="flex justify-between items-center mb-4">
                      <div className="tc-label">Tactical Guidance</div>
                      <button onClick={() => setActiveCompass(null)} className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                    <GuidanceCompass targetLat={m.coordinates.lat} targetLng={m.coordinates.lng} />
                  </div>
                )}
              </div>
            ))}
            {missions.length === 0 && <div className="col-span-full py-10 text-center font-mono text-[var(--ink-soft)] uppercase tracking-tighter">No missions currently active</div>}
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div onClick={(e)=>e.stopPropagation()} className="tc-card max-w-md w-full space-y-4" data-testid="complete-mission-modal">
            <div className="tc-label">Proof of Completion</div>
            <label className="tc-label">Photo URLs (comma-separated)</label>
            <input className="tc-input" placeholder="https://..." value={proof} onChange={(e)=>setProof(e.target.value)} data-testid="proof-urls" />
            <div className="flex gap-2 justify-end">
              <button className="btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => complete(selected)} data-testid="confirm-complete">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
