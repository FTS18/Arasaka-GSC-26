import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { MagnifyingGlass, Warning, Plus, Package, Truck, HandHeart, MapPin } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

const CATS = ["food","medicine","water","blanket","hygiene_kit","vehicle","fuel","bed","oxygen_cylinder","donation","other"];

export default function ResourcesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [res, setRes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", category: "food", quantity: 0, unit: "units", min_threshold: 10, warehouse: "Main Depot", lat: 0, lng: 0 }); // #10: no Delhi default
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    setLoading(true);
    try {
      // #4 #24: removed dead bundle-cache code (endpoint doesn't exist — caused double /api/ 404)
      const r = await api.get("/resources");
      setRes(r.data || []);
    } catch {
      toast.error("Failed to load resources");
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

  // #31: only use min_threshold — the fallback `< 10` was flagging vehicles etc. as critical
  const shortages = res.filter(r => r.quantity <= r.min_threshold);
  const filtered = res.filter(r => 
    (r.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (r.category || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.warehouse || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleRequisition = async (resource) => {
    // #12: prompt for quantity instead of hardcoded +20
    const inputQty = window.prompt(`Add how many units of "${resource.name}"?`, "20");
    if (inputQty === null) return;
    const qty = parseInt(inputQty, 10);
    if (isNaN(qty) || qty <= 0) { toast.error("Invalid quantity."); return; }
    const t = toast.loading(`Requisitioning ${qty} ${resource.unit || 'units'} of ${resource.name}...`);
    try {
      await api.patch(`/resources/${resource.id}`, { quantity: resource.quantity + qty });
      toast.success(`Requisition complete (+${qty} units)`, { id: t });
      load();
    } catch {
      toast.error("Requisition failed. Admin access required.", { id: t });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="resources-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="tc-label">{t("inventory")}</div>
          <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">{t("resources")}</h1>
        </div>
        {user?.role !== "user" && (
          <button className="btn-primary" onClick={() => setShow(true)} data-testid="add-resource-btn">+ {t("add_resource")}</button>
        )}
      </div>

      {shortages.length > 0 && (
        <div className="space-y-2">
          <div className="tc-label flex items-center gap-2 text-[var(--signal-red)]">
            <Warning weight="fill" /> {t("critical_requisition_queue")}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="tc-card min-w-[240px] flex flex-col justify-between animate-pulse">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="mt-4">
                    <Skeleton className="h-8 w-12" />
                  </div>
                </div>
              ))
            ) : (
              <>
                {shortages.map(s => (
                  <div key={s.id} className="tc-card min-w-[240px] border-l-4 border-[var(--signal-red)] flex flex-col justify-between" data-testid="shortage-card">
                    <div>
                      <div className="font-heading font-bold text-lg">{s.name}</div>
                      <div className="font-mono text-xs text-[var(--ink-soft)] uppercase mt-1">{s.warehouse}</div>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="font-mono text-2xl font-black text-[var(--signal-red)]">{s.quantity}</span>
                        <span className="font-mono text-xs mb-1 text-[var(--ink-soft)]">/ {t("min")} {s.min_threshold}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => handleRequisition(s)}
                        className="btn-hard !py-1.5 !px-3 !text-[10px] flex-1"
                      >
                        {t("requisition")}
                      </button>
                      {/* #11: Donation button now has a handler */}
                      <button
                        className="btn-ghost !py-1.5 !px-3 !text-[10px] flex-1"
                        onClick={() => toast.info("Contact your district coordinator to arrange a donation.")}
                      >{t("donation")}</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="tc-card p-4 flex items-center gap-3 flex-1 min-w-[300px]">
          <MagnifyingGlass weight="bold" className="text-[var(--ink-soft)]" />
          <input 
            placeholder={t("search_entries")} 
            className="bg-transparent border-none outline-none font-bold text-sm flex-1" 
            value={search} 
            onChange={(e)=>setSearch(e.target.value)} 
            data-testid="res-search"
          />
        </div>
        <div className="flex gap-2">
          <div className="tc-badge tc-badge-outl whitespace-nowrap">{filtered.length} {t("items")}</div>
          <div className="tc-badge tc-badge-crit whitespace-nowrap text-[var(--signal-red)]">{shortages.length} {t("alerts")}</div>
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
              [1, 2, 3, 4, 5, 6].map(i => (
                <tr key={i}>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                </tr>
              ))
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
              <div><label className="tc-label">Qty</label><input type="number" step="1" min="0" className="tc-input" value={form.quantity} onChange={(e)=>upd("quantity", e.target.value)} data-testid="res-qty" /></div>
              <div><label className="tc-label">Unit</label><input className="tc-input" value={form.unit} onChange={(e)=>upd("unit", e.target.value)} /></div>
              <div><label className="tc-label">Min</label><input type="number" className="tc-input" value={form.min_threshold} onChange={(e)=>upd("min_threshold", e.target.value)} /></div>
            </div>
            <div><label className="tc-label">Warehouse</label><input className="tc-input" value={form.warehouse} onChange={(e)=>upd("warehouse", e.target.value)} /></div>
              {/* #10: GPS button instead of raw lat/lng inputs */}
              <div>
                <label className="tc-label flex items-center gap-1"><MapPin size={12} weight="fill"/> Location</label>
                <div className="flex gap-2">
                  <input
                    className="tc-input flex-1 font-mono text-xs"
                    readOnly
                    value={form.lat && form.lng ? `${Number(form.lat).toFixed(4)}, ${Number(form.lng).toFixed(4)}` : "Not set — use GPS"}
                  />
                  <button type="button" className="btn-ghost border-2 border-[var(--ink)] px-3 text-xs font-black"
                    onClick={() => {
                      if (!navigator.geolocation) { toast.error("GPS not supported"); return; }
                      const t = toast.loading("Acquiring location...");
                      navigator.geolocation.getCurrentPosition(
                        (pos) => { upd("lat", pos.coords.latitude); upd("lng", pos.coords.longitude); toast.success("Location set", { id: t }); },
                        () => toast.error("GPS denied", { id: t }),
                        { timeout: 5000 }
                      );
                    }}
                  >GPS</button>
                </div>
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
