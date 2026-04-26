import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { offlineQueue } from "@/lib/offlineQueue";
import { toast } from "sonner";
import { Radio, ArrowLeft, Camera, Microphone } from "@phosphor-icons/react";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function CitizenPage() {
  const [form, setForm] = useState({ raw_text: "", image_urls: "", reporter_name: "", reporter_phone: "", language: "en" });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [listening, setListening] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = form.language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      upd("raw_text", form.raw_text + (form.raw_text ? " " : "") + transcript);
      toast.success("Voice transcribed");
    };
    
    recognition.onerror = () => {
      setListening(false);
      toast.error("Voice recognition timeout/failed");
    };

    recognition.start();
  };

  const handleCameraUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const t = toast.loading("Uploading photo evidence...");
    try {
      const url = await uploadToCloudinary(file);
      const existing = form.image_urls ? form.image_urls.split(',').map(x=>x.trim()).filter(Boolean) : [];
      existing.push(url);
      upd("image_urls", existing.join(', '));
      toast.success("Photo attached securely", { id: t });
    } catch {
      toast.error("Photo upload failed", { id: t });
    } finally {
      setUploadingImage(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!navigator.onLine) {
        offlineQueue.add("needs", form);
        toast.info("No connection detected. Report saved offline.");
        setSubmitted(true);
        return;
      }
      await api.post("/needs", form);
      setSubmitted(true);
      toast.success("Need reported successfully");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bone)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={22} weight="fill" className="text-[var(--signal-red)]" />
            <span className="font-heading text-xl font-black tracking-tighter">JANRAKSHAK</span>
            <span className="tc-label ml-4">CITIZEN PORTAL</span>
          </div>
          <Link to="/" className="btn-ghost text-[10px]"><ArrowLeft size={12} className="inline mr-1" /> Home</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 lg:py-24">
        <div className="tc-label">Report a Need</div>
        <h1 className="font-heading text-4xl font-black tracking-tighter mt-4 max-w-2xl">Tell us what's happening.</h1>
        <p className="mt-3 text-[var(--ink-soft)]">Your report helps field teams respond faster. AI will extract the urgency, category, and affected population automatically.</p>

        {!submitted ? (
          <form onSubmit={submit} className="tc-card mt-8 space-y-6" data-testid="citizen-form">
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="tc-label">Describe the situation</label>
                <button type="button" onClick={handleVoice} className={`btn-ghost p-2 rounded-full border-2 transition-all ${listening ? 'bg-[var(--signal-red)] border-[var(--signal-red)] text-white animate-pulse' : 'border-[var(--border)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[var(--ink)]'}`}>
                  <Microphone size={18} weight={listening ? "fill" : "bold"} />
                </button>
              </div>
              <textarea rows="6" className="tc-textarea" placeholder="E.g., 'Around 30 people in our street have no food since yesterday...'"
                        value={form.raw_text} onChange={(e)=>upd("raw_text", e.target.value)} required data-testid="citizen-text" />
              <div className="flex justify-between items-center text-xs font-mono mt-2">
                <span className="text-[var(--ink-soft)]">Hindi or English is fine</span>
                {listening && <span className="text-[var(--signal-red)] animate-pulse">Listening...</span>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="tc-label">Your Name (optional)</label><input className="tc-input" value={form.reporter_name} onChange={(e)=>upd("reporter_name", e.target.value)} data-testid="citizen-name" /></div>
              <div><label className="tc-label">Phone (optional)</label><input className="tc-input" value={form.reporter_phone} onChange={(e)=>upd("reporter_phone", e.target.value)} data-testid="citizen-phone" /></div>
            </div>
            <div>
              <label className="tc-label">Visual Evidence (optional)</label>
              <div className="flex gap-2 items-center mt-1">
                <input className="tc-input flex-1" value={form.image_urls} onChange={(e)=>upd("image_urls", e.target.value)} placeholder="Wait for upload..." readOnly />
                <label className="btn-ghost flex items-center justify-center gap-2 cursor-pointer border-2 border-[var(--ink)] px-4 h-[42px] hover:bg-[var(--ink)] hover:text-white transition-colors">
                  <Camera size={20} weight="bold" />
                  <span className="hidden md:inline">{uploadingImage ? "WAIT" : "SNAP"}</span>
                  <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleCameraUpload} disabled={uploadingImage} />
                </label>
              </div>
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
            <div className="tc-label text-[var(--success)]">Received</div>
            <div className="font-heading font-bold text-xl mt-1">Thank you — your report is in the queue.</div>
            <div className="tc-label">SOS Dispatch</div>
            <pre className="text-sm font-mono whitespace-pre-wrap mt-2 text-[var(--ink-soft)]">{JSON.stringify(submitted.extracted, null, 2)}</pre>
            <button className="btn-ghost mt-6" onClick={() => { setSubmitted(null); setForm({ raw_text: "", image_urls: "", reporter_name: "", reporter_phone: "", language: "en" }); }}>File Another</button>
          </div>
        )}
      </div>
    </div>
  );
}
