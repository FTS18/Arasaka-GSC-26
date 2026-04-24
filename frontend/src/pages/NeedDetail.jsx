import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Sparkle } from "@phosphor-icons/react";

export default function NeedDetail() {
  const { id } = useParams();
  const [need, setNeed] = useState(null);
  const [matches, setMatches] = useState([]);
  const [explain, setExplain] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const r = await api.get(`/needs/${id}`);
    setNeed(r.data);
    try {
      const m = await api.post(`/matching/suggest/${id}`);
      setMatches(m.data);
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

  if (!need) return <div className="p-8 font-mono">LOADING...</div>;

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="need-detail-page">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="overline">Request · {need.id.slice(0, 8)}</div>
          <h1 className="font-heading text-3xl md:text-4xl font-black tracking-tighter mt-1">{need.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={`tc-badge ${need.urgency >= 4 ? "tc-badge-crit" : "tc-badge-outl"}`}>U{need.urgency}</span>
            <span className="tc-badge tc-badge-outl">{need.category.replace(/_/g, " ")}</span>
            <span className={`tc-badge ${need.status === "completed" ? "tc-badge-res" : "tc-badge-high"}`}>{need.status}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="overline">Priority Score</div>
          <div className="font-mono font-black text-6xl text-[var(--signal-red)]">{Math.round(need.priority_score)}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 tc-card">
          <div className="overline">Description</div>
          <p className="mt-2 text-sm leading-relaxed">{need.description}</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-sm">
            <div><div className="overline">Affected</div><div className="font-bold text-2xl">{need.people_affected}</div></div>
            <div><div className="overline">Severity</div><div className="font-bold text-2xl">S{need.severity}</div></div>
            <div><div className="overline">Weather</div><div className="font-bold text-2xl">W{need.weather_factor}</div></div>
            <div><div className="overline">Source</div><div className="font-bold text-xs mt-2">{need.source}</div></div>
          </div>
          <div className="mt-4 overline">Location</div>
          <div className="font-mono text-sm mt-1">{need.location.lat.toFixed(4)}, {need.location.lng.toFixed(4)} {need.location.address && `· ${need.location.address}`}</div>
          <div className="mt-4 overline">Vulnerability</div>
          <div className="flex gap-2 mt-1 flex-wrap">
            {need.vulnerability.map(v => <span key={v} className="tc-badge tc-badge-crit">{v}</span>)}
          </div>
          {need.evidence_urls?.length > 0 && (
            <>
              <div className="mt-4 overline">Evidence</div>
              <div className="flex gap-3 mt-2 flex-wrap">
                {need.evidence_urls.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" className="block">
                    <img src={u} alt="evidence" className="w-32 h-32 object-cover border border-[var(--border)]" />
                  </a>
                ))}
              </div>
            </>
          )}
          <div className="mt-6 flex gap-3 flex-wrap">
            <button className="btn-primary" onClick={autoAssign} data-testid="auto-assign-btn">Auto-Assign Best Volunteer</button>
            <button className="btn-hard" onClick={explainMatch} disabled={loading} data-testid="ai-explain-btn">
              <Sparkle size={12} weight="fill" className="inline mr-1" />
              {loading ? "ANALYZING..." : "AI Recommend"}
            </button>
            {need.status !== "completed" && (
              <button className="btn-ghost" onClick={markComplete} data-testid="mark-complete-btn">Mark Complete</button>
            )}
          </div>
          {explain && (
            <div className="mt-4 tc-card border-l-2 border-[var(--signal-red)] bg-[var(--bone-alt)]">
              <div className="overline">AI Recommendation</div>
              <pre className="text-sm whitespace-pre-wrap font-body mt-2">{explain}</pre>
            </div>
          )}
        </div>

        <div className="tc-card">
          <div className="overline">Matched Volunteers</div>
          <div className="font-heading font-bold text-lg mt-1 mb-4">Top Candidates</div>
          {matches.length === 0 && <div className="font-mono text-xs text-[var(--ink-soft)]">NO MATCHES IN RANGE</div>}
          <div className="space-y-3">
            {matches.map(v => (
              <div key={v.id} className="border-b border-[var(--border)] pb-3 last:border-0" data-testid={`match-${v.id}`}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{v.name}</div>
                  <div className="font-mono font-bold text-[var(--signal-red)]">{v.match_score}</div>
                </div>
                <div className="font-mono text-[10px] text-[var(--ink-soft)] mt-1">
                  TRUST {v.trust_score} · {v.distance_km}km · {v.transport}
                </div>
                <div className="mt-2">
                  <button className="btn-ghost text-[10px] px-3 py-1" onClick={() => manualAssign(v.id)} data-testid={`assign-${v.id}`}>Assign</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
