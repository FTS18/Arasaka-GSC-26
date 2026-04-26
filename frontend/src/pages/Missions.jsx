import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [proof, setProof] = useState("");

  const load = async () => {
    const r = await api.get("/missions");
    setMissions(r.data);
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
          <div className="tc-label">Operational Units</div>
          <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Missions</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {missions.map(m => (
          <div key={m.id} className="tc-card" data-testid={`mission-card-${m.id}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="tc-label">Mission · {m.id.slice(0,8)}</div>
                <div className="font-heading font-bold text-lg mt-1">{m.need_ids.length} request(s) · {m.volunteer_ids.length} volunteer(s)</div>
              </div>
              <span className={`tc-badge ${m.status === "completed" ? "tc-badge-res" : "tc-badge-high"}`}>{m.status}</span>
            </div>
            {m.proof_urls?.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {m.proof_urls.map((u,i) => <img key={i} src={u} alt="proof" className="w-20 h-20 object-cover border border-[var(--border)]" />)}
              </div>
            )}
            {m.completion_notes && <div className="mt-2 text-xs text-[var(--ink-soft)] italic">"{m.completion_notes}"</div>}
            {m.status !== "completed" && (
              <button className="btn-hard mt-3 w-full" onClick={() => setSelected(m)} data-testid={`complete-btn-${m.id}`}>
                Mark Complete
              </button>
            )}
          </div>
        ))}
        {missions.length === 0 && <div className="col-span-full py-10 text-center font-mono text-[var(--ink-soft)]">NO MISSIONS YET</div>}
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
