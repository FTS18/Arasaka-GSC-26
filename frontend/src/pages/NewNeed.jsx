import React, { useState } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CATS = [
  "food","medical","shelter","education","sanitation","blood_donation","disaster_relief","emergency_transport","other"
];
const VULN = ["children","elderly","disabled","pregnant"];

export default function NewNeedPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "", category: "food", description: "",
    lat: 28.6139, lng: 77.2090, address: "",
    urgency: 3, people_affected: 10, severity: 3, weather_factor: 1,
    vulnerability: [], evidence_urls: [],
  });
  const [loading, setLoading] = useState(false);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleVuln = (v) => upd("vulnerability", form.vulnerability.includes(v) ? form.vulnerability.filter(x=>x!==v) : [...form.vulnerability, v]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        title: form.title, category: form.category, description: form.description,
        location: { lat: Number(form.lat), lng: Number(form.lng), address: form.address || null },
        urgency: Number(form.urgency), people_affected: Number(form.people_affected),
        severity: Number(form.severity), weather_factor: Number(form.weather_factor),
        vulnerability: form.vulnerability.length ? form.vulnerability : ["none"],
        evidence_urls: form.evidence_urls,
        source: "field_worker",
      };
      const r = await api.post("/needs", body);
      toast.success(`Filed · priority ${Math.round(r.data.priority_score)}`);
      nav(`/needs/${r.data.id}`);
    } catch (err) { toast.error(err?.response?.data?.detail || "Submission failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 md:p-8" data-testid="new-need-page">
      <div className="overline">Intake</div>
      <h1 className="font-heading text-4xl font-black tracking-tighter mt-1 mb-6">New Request</h1>

      <form onSubmit={submit} className="tc-card max-w-3xl space-y-5">
        <div><label className="tc-label">Title</label><input className="tc-input" value={form.title} onChange={(e)=>upd("title", e.target.value)} required data-testid="need-title" /></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="tc-label">Category</label>
            <select className="tc-select" value={form.category} onChange={(e)=>upd("category", e.target.value)} data-testid="need-category">
              {CATS.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="tc-label">People Affected</label>
            <input type="number" min="1" className="tc-input" value={form.people_affected} onChange={(e)=>upd("people_affected", e.target.value)} data-testid="need-affected" />
          </div>
        </div>
        <div>
          <label className="tc-label">Description</label>
          <textarea rows="4" className="tc-textarea" value={form.description} onChange={(e)=>upd("description", e.target.value)} required data-testid="need-description" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div><label className="tc-label">Latitude</label><input className="tc-input" value={form.lat} onChange={(e)=>upd("lat", e.target.value)} data-testid="need-lat" /></div>
          <div><label className="tc-label">Longitude</label><input className="tc-input" value={form.lng} onChange={(e)=>upd("lng", e.target.value)} data-testid="need-lng" /></div>
          <div><label className="tc-label">Address</label><input className="tc-input" value={form.address} onChange={(e)=>upd("address", e.target.value)} data-testid="need-address" /></div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="tc-label">Urgency (1-5)</label>
            <input type="range" min="1" max="5" value={form.urgency} onChange={(e)=>upd("urgency", e.target.value)} className="w-full" data-testid="need-urgency" />
            <div className="font-mono font-bold">U{form.urgency}</div>
          </div>
          <div>
            <label className="tc-label">Severity (1-5)</label>
            <input type="range" min="1" max="5" value={form.severity} onChange={(e)=>upd("severity", e.target.value)} className="w-full" data-testid="need-severity" />
            <div className="font-mono font-bold">S{form.severity}</div>
          </div>
          <div>
            <label className="tc-label">Weather Factor (1-5)</label>
            <input type="range" min="1" max="5" value={form.weather_factor} onChange={(e)=>upd("weather_factor", e.target.value)} className="w-full" data-testid="need-weather" />
            <div className="font-mono font-bold">W{form.weather_factor}</div>
          </div>
        </div>
        <div>
          <label className="tc-label">Vulnerability Flags</label>
          <div className="flex flex-wrap gap-2">
            {VULN.map(v => (
              <button
                type="button" key={v}
                onClick={()=>toggleVuln(v)}
                className={`tc-badge cursor-pointer ${form.vulnerability.includes(v) ? "tc-badge-crit" : "tc-badge-outl"}`}
                data-testid={`vuln-${v}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="tc-label">Evidence URLs (comma separated)</label>
          <input className="tc-input" placeholder="https://..." onChange={(e)=>upd("evidence_urls", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} data-testid="need-evidence" />
        </div>
        <button className="btn-primary" disabled={loading} data-testid="need-submit">
          {loading ? "FILING..." : "FILE REQUEST"}
        </button>
      </form>
    </div>
  );
}
