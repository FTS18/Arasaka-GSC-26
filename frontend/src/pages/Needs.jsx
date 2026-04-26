import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MagnifyingGlass, Funnel, Scan, FileCsv } from "@phosphor-icons/react";

export default function NeedsPage() {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (status) q.append("status", status);
      if (category) q.append("category", category);
      const r = await api.get(`/needs?${q.toString()}`);
      setNeeds(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status, category]);

  const reprioritize = async () => {
    try { await api.post("/needs/reprioritize"); toast.success("Re-prioritized"); load(); }
    catch { toast.error("Requires admin/field worker role"); }
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const t = toast.loading("🤖 AI Vision transcribing paper survey...");
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        try {
          await api.post("/needs/ocr", {
            image_base64: base64,
            mime_type: file.type,
            lat: 28.6139,
            lng: 77.2090
          });
          toast.success("Survey digitized successfully", { id: t });
          load();
        } catch (err) {
          toast.error("Transcription failed", { id: t });
        } finally {
          setUploadingImage(false);
          e.target.value = null;
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("File parsing failed", { id: t });
      setUploadingImage(false);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const t = toast.loading("Processing Bulk CSV data...");
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await api.post("/needs/bulk_csv", { csv_text: reader.result });
          toast.success(`Imported ${res.data.created} needs successfully`, { id: t });
          load();
        } catch (err) {
          toast.error("CSV import failed", { id: t });
        } finally {
          e.target.value = null;
        }
      };
      reader.readAsText(file);
    } catch {
      toast.error("File parsing failed", { id: t });
    }
  };

  const filtered = needs.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="needs-page">
      {/* Absolute Minimalist Header */}
      <div className="pb-2">
        <h1 className="font-heading text-4xl font-black uppercase tracking-tighter leading-none text-[var(--ink)]">
          Requests
        </h1>
      </div>

      {/* Equal-Width Modular Rack */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Module 1: Universal Search */}
        <div className="bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] flex items-center h-14 group transition-all hover:border-[var(--ink-muted)]">
          <div className="w-14 h-full flex items-center justify-center border-r-2 border-[var(--border)] bg-[var(--bone-alt)] group-focus-within:bg-[var(--ink-soft)] group-focus-within:text-white transition-colors">
            <MagnifyingGlass size={20} weight="bold" />
          </div>
          <input 
            type="text" 
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-xs font-bold text-[var(--ink)] placeholder:text-[var(--ink-muted)] placeholder:font-normal uppercase tracking-wider" 
            placeholder="Search entries..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Module 2: High-Density Filters */}
        <div className="grid grid-cols-2 bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] h-14 overflow-hidden transition-all hover:border-[var(--ink-muted)]">
          <div className="border-r-2 border-[var(--border)] flex items-center">
            <select className="w-full bg-transparent text-[10px] font-black uppercase py-4 px-4 outline-none cursor-pointer hover:bg-[var(--bone-alt)] transition-colors" value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option value="">STATUS: ALL</option>
              <option value="pending">PENDING</option>
              <option value="assigned">ASSIGNED</option>
              <option value="in_progress">LIVE OPS</option>
              <option value="completed">RESOLVED</option>
            </select>
          </div>
          <div className="flex items-center">
            <select className="w-full bg-transparent text-[10px] font-black uppercase py-4 px-4 outline-none cursor-pointer hover:bg-[var(--bone-alt)] transition-colors" value={category} onChange={(e)=>setCategory(e.target.value)}>
              <option value="">SECTOR: ALL</option>
              <option value="food">FOOD SUPPLY</option>
              <option value="medical">MEDICAL GEAR</option>
              <option value="shelter">SHELTER INFO</option>
              <option value="blood_donation">BLOOD OPS</option>
              <option value="disaster_relief">RELIEF EFFORT</option>
            </select>
          </div>
        </div>

        {/* Module 3: Combined Actions (Now Equal Width) */}
        <div className="flex gap-2 h-14">
          <div className="flex-1 bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] flex items-center justify-around h-full transition-all hover:border-[var(--ink-muted)]">
            <label className="flex-1 h-full flex items-center justify-center hover:bg-[var(--bone-alt)] cursor-pointer text-[var(--ink)] transition-colors border-r-2 border-[var(--border)]/30" title="Export CSV">
              <FileCsv size={22} weight="bold" />
              <input type="file" className="hidden" accept=".csv" onChange={handleCsvUpload} />
            </label>
            <label className="flex-1 h-full flex items-center justify-center hover:bg-[var(--bone-alt)] cursor-pointer text-[var(--ink)] transition-colors border-r-2 border-[var(--border)]/30" title="Import Document">
              <Scan size={22} weight="bold" />
              <input type="file" className="hidden" accept="image/*" onChange={handleOcrUpload} disabled={uploadingImage} />
            </label>
            <button className="flex-1 h-full flex items-center justify-center hover:bg-[var(--bone-alt)] text-[var(--ink)] transition-colors" onClick={reprioritize} title="Recalculate">
              <Funnel size={22} weight="bold" />
            </button>
          </div>
          <Link to="/needs/new" className="bg-[var(--signal-red)] text-white border-2 border-[var(--signal-red)] px-6 flex items-center justify-center font-black uppercase text-[11px] tracking-tighter shadow-[4px_4px_0px_rgba(230,57,70,0.2)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
            + NEW
          </Link>
        </div>
      </div>

        <div className="bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] overflow-x-auto transition-all">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--bone-alt)] border-b-2 border-[var(--border)]">
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Prio</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Operation Details</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Sector</th>
              <th className="py-2.5 px-4 text-center text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Urg</th>
              <th className="py-2.5 px-4 text-center text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Pop</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase text-[var(--ink-soft)] tracking-wider">Status</th>
              <th className="py-2.5 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]/50">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-2.5 px-4"><div className="h-4 w-8 bg-[var(--bone-alt)] rounded" /></td>
                  <td className="py-2.5 px-4"><div className="h-4 w-48 bg-[var(--bone-alt)] rounded" /></td>
                  <td className="py-2.5 px-4"><div className="h-4 w-20 bg-[var(--bone-alt)] rounded" /></td>
                  <td className="py-2.5 px-4"><div className="h-4 w-8 bg-[var(--bone-alt)] mx-auto rounded" /></td>
                  <td className="py-2.5 px-4"><div className="h-4 w-12 bg-[var(--bone-alt)] mx-auto rounded" /></td>
                  <td className="py-2.5 px-4"><div className="h-5 w-20 bg-[var(--bone-alt)] rounded" /></td>
                  <td className="py-2.5 px-4 text-right"><div className="h-7 w-20 bg-[var(--bone-alt)] ml-auto rounded" /></td>
                </tr>
              ))
            ) : filtered.map((n) => (
              <tr key={n.id} className="hover:bg-[var(--bone-alt)]/30 border-b border-[var(--ink)]/5 last:border-0 transition-colors">
                <td className="py-2.5 px-4 font-mono font-bold text-[var(--signal-red)] text-sm">{Math.round(n.priority_score)}</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--ink)] text-[12px] whitespace-nowrap">{n.title}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <span className="text-[10px] font-medium uppercase text-[var(--ink-soft)] tracking-tight">
                    {n.category.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className={`px-1.5 py-0.5 font-bold text-[9px] ${
                    n.urgency >= 4 ? "bg-[var(--signal-red)] text-white" : "border border-[var(--ink)]/10 text-[var(--ink-soft)]"
                  }`}>
                    U{n.urgency}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-center font-mono font-semibold text-[var(--ink)] text-xs">{n.people_affected}</td>
                <td className="py-2.5 px-4">
                  <div className={`px-2 py-0.5 text-[9px] font-bold uppercase text-center border border-[var(--ink)]/20 ${
                    n.status === "completed" ? "bg-green-600/90 text-white" : 
                    n.status === "pending" ? "bg-amber-400 text-[var(--ink)]" : 
                    "bg-blue-600/90 text-white"
                  }`}>
                    {n.status.replace(/_/g, " ")}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <Link to={`/needs/${n.id}`} className="inline-block bg-[var(--ink-soft)] text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-tight shadow-[2px_2px_0px_rgba(42,61,49,0.2)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:bg-[var(--ink)] transition-all">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-[var(--ink-soft)] font-mono">NO RESULTS</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
