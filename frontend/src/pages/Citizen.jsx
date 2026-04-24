import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Radio, ArrowLeft } from "@phosphor-icons/react";

export default function CitizenPage() {
  const [form, setForm] = useState({ raw_text: "", image_urls: "", reporter_name: "", reporter_phone: "", language: "en" });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        raw_text: form.raw_text,
        image_urls: form.image_urls.split(",").map(s=>s.trim()).filter(Boolean),
        reporter_name: form.reporter_name || null,
        reporter_phone: form.reporter_phone || null,
        language: form.language,
      };
      const r = await api.post("/citizen/reports", body);
      setSubmitted(r.data);
      toast.success("Report received. AI is analyzing.");
    } catch { toast.error("Submission failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--bone)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={22} weight="fill" className="text-[var(--signal-red)]" />
            <span className="font-heading text-xl font-black tracking-tighter">HUMOPS</span>
            <span className="overline ml-2">CITIZEN PORTAL</span>
          </div>
          <Link to="/" className="btn-ghost text-[10px]"><ArrowLeft size={12} className="inline mr-1" /> Home</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="overline">Report a Need</div>
        <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Tell us what's happening.</h1>
        <p className="mt-3 text-[var(--ink-soft)]">Your report helps field teams respond faster. AI will extract the urgency, category, and affected population automatically.</p>

        {!submitted ? (
          <form onSubmit={submit} className="tc-card mt-8 space-y-5" data-testid="citizen-form">
            <div>
              <label className="tc-label">Describe the situation</label>
              <textarea rows="6" className="tc-textarea" placeholder="E.g., 'Around 30 people in our street have no food since yesterday...'"
                        value={form.raw_text} onChange={(e)=>upd("raw_text", e.target.value)} required data-testid="citizen-text" />
              <div className="text-xs font-mono text-[var(--ink-soft)] mt-1">Hindi or English is fine</div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="tc-label">Your Name (optional)</label><input className="tc-input" value={form.reporter_name} onChange={(e)=>upd("reporter_name", e.target.value)} data-testid="citizen-name" /></div>
              <div><label className="tc-label">Phone (optional)</label><input className="tc-input" value={form.reporter_phone} onChange={(e)=>upd("reporter_phone", e.target.value)} data-testid="citizen-phone" /></div>
            </div>
            <div><label className="tc-label">Image URLs (comma-separated, optional)</label>
              <input className="tc-input" value={form.image_urls} onChange={(e)=>upd("image_urls", e.target.value)} placeholder="https://..." data-testid="citizen-images" />
            </div>
            <div><label className="tc-label">Language</label>
              <select className="tc-select" value={form.language} onChange={(e)=>upd("language", e.target.value)} data-testid="citizen-lang">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <button className="btn-primary w-full" disabled={loading} data-testid="citizen-submit">
              {loading ? "SENDING..." : "SUBMIT REPORT"}
            </button>
          </form>
        ) : (
          <div className="tc-card mt-8" data-testid="citizen-success">
            <div className="overline text-[var(--success)]">Received</div>
            <div className="font-heading font-bold text-xl mt-1">Thank you — your report is in the queue.</div>
            <div className="mt-4 overline">AI Extraction</div>
            <pre className="text-sm font-mono whitespace-pre-wrap mt-2 text-[var(--ink-soft)]">{JSON.stringify(submitted.extracted, null, 2)}</pre>
            <button className="btn-ghost mt-6" onClick={() => { setSubmitted(null); setForm({ raw_text: "", image_urls: "", reporter_name: "", reporter_phone: "", language: "en" }); }}>File Another</button>
          </div>
        )}
      </div>
    </div>
  );
}
