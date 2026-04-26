import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { TableRowSkeleton, CardSkeleton } from "@/components/SkeletonLoader";
import { MagnifyingGlass, Warning, Plus, Package, Truck, HandHeart } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";

const CATS = ["food","medicine","water","blanket","hygiene_kit","vehicle","fuel","bed","oxygen_cylinder","donation","other"];

export default function ResourcesPage() {
  const { user } = useAuth();
  const [res, setRes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", category: "food", quantity: 0, unit: "units", min_threshold: 10, warehouse: "Main Depot", lat: 28.6139, lng: 77.2090 });
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    setLoading(true);
    try {
      // 🏛️ Strategy 2 & 4: Multi-Stage Bundle Loading
      const localBundle = localStorage.getItem("bundle_resources");
      const bundleMeta = JSON.parse(localStorage.getItem("bundle_resources_meta") || "{}");
      
      const now = Date.now();
      const isStale = !bundleMeta.timestamp || (now - bundleMeta.timestamp > 3600000); // 1h Stale

      if (localBundle && !isStale) {
        setRes(JSON.parse(localBundle));
        setLoading(false);
        return;
      }

      // Try Server Bundle (1 read per hour total)
      try {
        const bundleRes = await api.get("/api/system/bundle/resources");
        if (bundleRes.data?.data) {
          setRes(bundleRes.data.data);
          localStorage.setItem("bundle_resources", JSON.stringify(bundleRes.data.data));
          localStorage.setItem("bundle_resources_meta", JSON.stringify({ timestamp: now }));
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Bundle server unavailable, falling back to direct reads.");
      }

      // Final Fallback: Direct reads
      const r = await api.get("/resources");
      setRes(r.data);
    } finally {
      setLoading(false);
    }
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

  const shortages = res.filter(r => r.quantity <= r.min_threshold || r.quantity < 10);
  const filtered = res.filter(r => 
    (r.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (r.category || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.warehouse || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleRequisition = async (resource) => {
    const t = toast.loading(`Initiating requisition for ${resource.name}...`);
    try {
      await api.patch(`/resources/${resource.id}`, { quantity: resource.quantity + 20 });
      toast.success("Requisition successful (+20 units)", { id: t });
      load();
    } catch {
      toast.error("Requisition failed. Admin access required.", { id: t });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="resources-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="tc-label">Inventory</div>
          <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Resources</h1>
        </div>
        {user?.role !== "user" && (
          <button className="btn-primary" onClick={() => setShow(true)} data-testid="add-resource-btn">+ Add Resource</button>
        )}
      </div>

      {shortages.length > 0 && (
        <div className="space-y-2">
          <div className="tc-label flex items-center gap-2 text-[var(--signal-red)]">
            <Warning weight="fill" /> Critical Requisition Queue
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {loading ? (
              [1, 2, 3].map(i => <CardSkeleton key={i} />)
            ) : (
              <>
                {shortages.map(s => (
                  <div key={s.id} className="tc-card min-w-[240px] border-l-4 border-[var(--signal-red)] flex flex-col justify-between" data-testid="shortage-card">
                    <div>
                      <div className="font-heading font-bold text-lg">{s.name}</div>
                      <div className="font-mono text-xs text-[var(--ink-soft)] uppercase mt-1">{s.warehouse}</div>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="font-mono text-2xl font-black text-[var(--signal-red)]">{s.quantity}</span>
                        <span className="font-mono text-xs mb-1 text-[var(--ink-soft)]">/ Min {s.min_threshold}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => handleRequisition(s)}
                        className="btn-hard !py-1.5 !px-3 !text-[10px] flex-1"
                      >
                        Requisition
                      </button>
                      <button className="btn-ghost !py-1.5 !px-3 !text-[10px] flex-1">Donation</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" size={18} />
          <input 
            type="text" 
            className="tc-search-input" 
            placeholder="Search inventory (name, type, warehouse)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="tc-badge tc-badge-outl whitespace-nowrap">{filtered.length} items</div>
          <div className="tc-badge tc-badge-crit whitespace-nowrap text-[var(--signal-red)]">{shortages.length} alerts</div>
        </div>
      </div>

      <div className="tc-card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="tc-table-header">
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Min</th>
              <th>Warehouse</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => <TableRowSkeleton key={i} />)
            ) : filtered.map(r => {
              const low = r.quantity <= r.min_threshold;
              return (
                <tr key={r.id} className="border-b border-[var(--border)] font-mono" data-testid={`res-row-${r.id}`}>
                  <td className="py-4 px-4 font-semibold">{r.name || "UNNAMED"}</td>
                  <td className="py-4 px-4"><span className="tc-badge tc-badge-outl">{(r.category || "other").replace(/_/g," ")}</span></td>
                  <td className="py-4 px-4 font-mono font-bold">{r.quantity} {r.unit}</td>
                  <td className="py-4 px-4 font-mono text-[var(--ink-soft)]">{r.min_threshold}</td>
                  <td className="py-4 px-4">{r.warehouse}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${low ? "bg-[var(--signal-red)] shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-green-500"}`} />
                    <span className={`tc-badge ${low ? "tc-badge-crit" : "tc-badge-res"}`}>{low ? "Low" : "Optimal"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShow(false)}>
          <form onClick={(e)=>e.stopPropagation()} onSubmit={submit} className="tc-card max-w-md w-full space-y-4" data-testid="add-resource-form">
            <div className="tc-label">Add Resource</div>
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
