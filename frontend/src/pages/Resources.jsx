import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const CATS = ["food","medicine","water","blanket","hygiene_kit","vehicle","fuel","bed","oxygen_cylinder","donation","other"];

export default function ResourcesPage() {
  const [res, setRes] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", category: "food", quantity: 0, unit: "units", min_threshold: 10, warehouse: "Main Depot", lat: 28.6139, lng: 77.2090 });
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    const r = await api.get("/resources");
    setRes(r.data);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/resources", {
        ...form,
        quantity: Number(form.quantity),
        min_threshold: Number(form.min_threshold),
        location: { lat: Number(form.lat), lng: Number(form.lng) },
      });
      toast.success("Resource added"); setShow(false); load();
    } catch { toast.error("Requires admin/field_worker/donor"); }
  };

  const shortages = res.filter(r => r.quantity <= r.min_threshold);

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="resources-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="overline">Inventory</div>
          <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Resources</h1>
        </div>
        <button className="btn-primary" onClick={() => setShow(true)} data-testid="add-resource-btn">+ Add Resource</button>
      </div>

      {shortages.length > 0 && (
        <div className="tc-card tc-card-crit" data-testid="shortage-banner">
          <div className="overline text-[var(--signal-red)]">SHORTAGE ALERTS</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {shortages.map(s => (
              <span key={s.id} className="tc-badge tc-badge-crit">{s.name}: {s.quantity} {s.unit}</span>
            ))}
          </div>
        </div>
      )}

      <div className="tc-card">
        <table className="w-full text-sm">
          <thead className="text-left overline border-b border-[var(--border)]">
            <tr><th className="py-2">Name</th><th>Category</th><th>Qty</th><th>Min</th><th>Warehouse</th><th>Status</th></tr>
          </thead>
          <tbody>
            {res.map(r => {
              const low = r.quantity <= r.min_threshold;
              return (
                <tr key={r.id} className="border-b border-[var(--border)]" data-testid={`res-row-${r.id}`}>
                  <td className="py-3 font-semibold">{r.name}</td>
                  <td><span className="tc-badge tc-badge-outl">{r.category.replace(/_/g," ")}</span></td>
                  <td className="font-mono font-bold">{r.quantity} {r.unit}</td>
                  <td className="font-mono text-[var(--ink-soft)]">{r.min_threshold}</td>
                  <td>{r.warehouse}</td>
                  <td><span className={`tc-badge ${low ? "tc-badge-crit" : "tc-badge-res"}`}>{low ? "LOW" : "OK"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShow(false)}>
          <form onClick={(e)=>e.stopPropagation()} onSubmit={submit} className="tc-card max-w-md w-full space-y-4" data-testid="add-resource-form">
            <div className="overline">Add Resource</div>
            <div><label className="tc-label">Name</label><input className="tc-input" value={form.name} onChange={(e)=>upd("name", e.target.value)} required data-testid="res-name" /></div>
            <div><label className="tc-label">Category</label>
              <select className="tc-select" value={form.category} onChange={(e)=>upd("category", e.target.value)}>
                {CATS.map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="tc-label">Qty</label><input type="number" className="tc-input" value={form.quantity} onChange={(e)=>upd("quantity", e.target.value)} data-testid="res-qty" /></div>
              <div><label className="tc-label">Unit</label><input className="tc-input" value={form.unit} onChange={(e)=>upd("unit", e.target.value)} /></div>
              <div><label className="tc-label">Min</label><input type="number" className="tc-input" value={form.min_threshold} onChange={(e)=>upd("min_threshold", e.target.value)} /></div>
            </div>
            <div><label className="tc-label">Warehouse</label><input className="tc-input" value={form.warehouse} onChange={(e)=>upd("warehouse", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="tc-label">Latitude</label><input className="tc-input" value={form.lat} onChange={(e)=>upd("lat", e.target.value)} /></div>
              <div><label className="tc-label">Longitude</label><input className="tc-input" value={form.lng} onChange={(e)=>upd("lng", e.target.value)} /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn-ghost" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn-primary" data-testid="res-submit">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
