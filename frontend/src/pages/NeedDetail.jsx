import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { Sparkle, MapPin, CheckCircle, Clock, Warning, ShieldCheck, Camera, FileMagnifyingGlass, Microphone } from "@phosphor-icons/react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Skeleton } from "@/components/ui/skeleton";

const MissionTimeline = ({ need }) => {
  const { t } = useI18n();
  const steps = [
    { id: 'created', label: t('mission_created'), time: need.created_at, active: !!need.created_at },
    { id: 'assigned', label: t('asset_assigned'), time: need.assigned_at, active: need.status !== 'pending' },
    { id: 'enroute', label: t('en_route'), time: need.enroute_at, active: need.status === 'in_progress' || need.status === 'completed' },
    { id: 'proof', label: t('proof_uploaded'), time: need.proof_urls?.[0] ? need.updated_at : null, active: (need.proof_urls?.length || 0) > 0 },
    { id: 'verified', label: t('ai_verified'), time: need.ai_verification?.timestamp, active: !!need.ai_verification, color: 'text-blue-600' },
    { id: 'completed', label: t('mission_closed'), time: need.completed_at, active: need.status === 'completed' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bone)] border-2 border-[var(--border)] p-6 shadow-[4px_4px_0px_var(--bone-alt)]">
        <div className="tc-label mb-6 tracking-[0.2em] opacity-60">TACTICAL TIMELINE</div>
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={step.id} className={`flex items-start gap-4 ${step.active ? "opacity-100" : "opacity-30"}`}>
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 ${step.active ? "bg-[var(--signal-red)] border-[var(--signal-red)]" : "bg-[var(--bone-alt)] border-[var(--border)]"}`} />
                {i < steps.length - 1 && <div className="w-[1px] h-8 bg-[var(--border)]" />}
              </div>
              <div className="flex-1 -mt-1">
                <div className={`text-[10px] font-black uppercase tracking-tight ${step.color || 'text-[var(--ink)]'}`}>{step.label}</div>
                {step.active && step.time && (
                  <div className="text-[8px] font-mono opacity-60">{new Date(step.time).toLocaleString()}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {need.ai_verification && (
        <div className="bg-blue-50 border-2 border-blue-200 p-4 font-mono text-[9px]">
          <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold uppercase tracking-widest">
            <ShieldCheck size={16} /> AI AUDIT CERTIFIED: {need.ai_verification.reliability_score}% RELIABILITY
          </div>
          <div className="opacity-70 text-blue-900 mb-2">
            DETECTION: {need.ai_verification.detected_items?.join(", ") || "None"}
          </div>
          <div className="italic text-blue-700">
            "{need.ai_verification.audit_notes || need.ai_verification.authenticity_justification}"
          </div>
        </div>
      )}
    </div>
  );
};

const tacticalIcon = L.divIcon({
  className: 'tactical-marker',
  html: `<div style="background-color: #E63946; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 4px rgba(230, 57, 70, 0.3);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

export default function NeedDetail() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { id } = useParams();
  const [need, setNeed] = useState(null);
  const [matches, setMatches] = useState([]);
  const [explain, setExplain] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [assignedVol, setAssignedVol] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const load = async () => {
    try {
      const r = await api.get(`/needs/${id}`);
      setNeed(r.data);

      if (r.data.status !== 'pending' && r.data.assigned_volunteer_ids?.length > 0) {
        // Show first assigned volunteer — #33: guard multiple assignees
        const v = await api.get(`/volunteers/${r.data.assigned_volunteer_ids[0]}`);
        setAssignedVol(v.data);
      } else if (r.data.status === 'pending') {
        // #27: Only call AI matching for pending needs — save credits
        try {
          const m = await api.post(`/matching/suggest/${id}`);
          setMatches(m.data || []);
        } catch { setMatches([]); }
        setAssignedVol(null);
      } else {
        setAssignedVol(null);
      }
    } catch {}
  };

  useEffect(() => { load(); }, [id]);

  const explainMatch = async () => {
    setLoading(true);
    try {
      const r = await api.post(`/matching/explain/${id}`);
      setExplain(r.data.recommendation);
    } catch { toast.error(t('ai_unavailable')); }
    finally { setLoading(false); }
  };

  const autoAssign = async () => {
    try {
      await api.post(`/matching/auto-assign/${id}`);
      toast.success(t('auto_assigned'));
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const claimNeed = async () => {
    const t = toast.loading("Processing Tactical Claim...");
    try {
      await api.post(`/needs/${id}/claim`);
      toast.success("Mission Claimed: Operation Active", { id: t });
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Claim failed", { id: t });
    }
  };

  const manualAssign = async (vid) => {
    const t = toast.loading("Assigning asset...");
    try {
      await api.patch(`/needs/${id}`, { status: "assigned", assigned_volunteer_ids: [vid] });
      toast.success("Asset Assigned — Mission Active", { id: t });
      load();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error || e?.message || "Assignment failed";
      toast.error(`Assignment Error: ${msg}`, { id: t });
    }
  };

  const markComplete = async () => {
    try {
      // #29: server sets completed_at — don't set from frontend
      await api.patch(`/needs/${id}`, { status: "completed" });
      toast.success("Marked complete"); load();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Failed";
      toast.error(msg);
    }
  };

  const handleAiVerify = async () => {
    if (!need.evidence_urls?.[0]) return toast.error("No field evidence for audit");
    setVerifying(true);
    const t = toast.loading("AI Strategic Audit in progress...");
    try {
      // #1: fixed double /api/ prefix
      const r = await api.post(`/needs/${id}/verify-proof`, { image: need.evidence_urls[0] });
      toast.success(`Audit Complete: ${r.data.reliability_score}% Accuracy`, { id: t });
      load();
    } catch {
      toast.error("Telemetry link severed during audit", { id: t });
    } finally {
      setVerifying(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await handleAudioUpload(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.info("Recording Tactical Memo...");
    } catch (err) {
      toast.error("Microphone access denied or unsupported");
    }
  };

  const handleAudioUpload = async (blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      try {
        // #2: fixed double /api/ prefix
        await api.post(`/needs/${id}/transcribe-note`, { 
          audio: base64Audio,
          mime_type: 'audio/webm'
        });
        toast.success("Field Note Transcribed!");
        setIsRecording(false);
        load();
      } catch (err) {
        toast.error("AI Transcription failed");
        setIsRecording(false);
      }
    };
  };

  // #22: proper loading skeleton
  if (!need) return (
    <div className="p-4 md:p-8 space-y-10 animate-pulse">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-14 w-full max-w-2xl" />
        <Skeleton className="h-4 w-1/3" />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Main Content Skeleton */}
          <div className="tc-card p-6 space-y-6">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="h-[300px] w-full bg-[var(--bone-alt)] rounded-sm overflow-hidden">
               <Skeleton className="h-full w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* Tactical Timeline Skeleton */}
          <div className="tc-card p-6">
            <Skeleton className="h-3 w-32 mb-8" />
            <div className="space-y-8 pl-4 border-l-2 border-[var(--bone-alt)] relative">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-[var(--bone-alt)]" />
                  <div className="space-y-2">
                    <Skeleton className="h-2 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6" data-testid="need-detail-page">
      {/* 01: Mission Profile Header */}
      <div className="bg-[var(--bone)] border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] p-4 md:p-6 transition-all hover:border-[var(--ink-muted)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-[var(--ink-soft)] text-white text-[9px] font-black px-2 py-0.5 tracking-widest">Mission ID</span>
              <span className="text-[10px] font-mono font-bold text-[var(--ink-soft)]">{need.id?.toUpperCase() || "N/A"}</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tighter leading-none text-[var(--ink)]">
              {need.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className={`px-3 py-1.5 border-2 border-[var(--border)] text-[10px] font-black flex items-center gap-2 shadow-[2px_2px_0px_var(--bone-alt)] ${need.urgency >= 4 ? "bg-[var(--signal-red)] text-white border-[var(--signal-red)] shadow-[2px_2px_0px_rgba(230,57,70,0.2)]" : "bg-[var(--bone)] text-[var(--ink)]"}`}>
                {/* #7: U = Urgency, not S = Severity */}
                Urgency: U{need.urgency}
              </div>
              <div className="px-3 py-1.5 border-2 border-[var(--border)] bg-[var(--bone-alt)] text-[var(--ink)] text-[10px] font-black shadow-[2px_2px_0px_var(--bone-alt)]">
                Sector: {(need.category || "other").replace(/_/g, " ")}
              </div>
              <div className="px-3 py-1.5 border-2 border-[var(--border)] bg-[var(--ink-soft)] text-white text-[10px] font-black shadow-[2px_2px_0px_var(--bone-alt)]">
                Status: {need.status}
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--bone-alt)] border-2 border-[var(--border)] p-4 flex flex-col items-center justify-center min-w-[140px] shadow-[4px_4px_0px_var(--bone-alt)]">
            <div className="text-[9px] font-black uppercase text-[var(--ink-soft)] tracking-widest mb-1 text-center">Priority Score</div>
            <div className="font-heading text-6xl font-black text-[var(--signal-red)] tabular-nums leading-none">
              {Math.round(need.priority_score)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Intelligence Modules */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Affected', val: need.people_affected || need.population || "NR", icon: 'POP' },
              { label: 'Severity', val: `S${need.severity || 1}`, icon: 'LVL' },
              { label: 'Weather', val: need.weather_factor || need.weather_code || "W1", icon: 'ENV' },
              { label: 'Source', val: (need.source || "Archive").replace(/_/g, ' '), icon: 'SRC' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[var(--bone)] border-2 border-[var(--border)] p-3 shadow-[4px_4px_0px_var(--bone-alt)] group hover:bg-[var(--bone-alt)] transition-colors hover:border-[var(--ink-soft)]">
                <div className="text-[9px] font-black text-[var(--ink-soft)] tracking-widest border-b border-[var(--border)] pb-1 mb-2 flex justify-between">
                  {stat.label}
                  <span className="opacity-30 tracking-widest">{stat.icon}</span>
                </div>
                <div className="text-2xl font-black text-[var(--ink)] truncate">{stat.val}</div>
              </div>
            ))}
          </div>

          <div className="bg-[var(--bone)] border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] flex flex-col transition-all hover:border-[var(--ink-muted)] overflow-hidden">
            <div className="border-b-2 border-[var(--border)] bg-[var(--bone-alt)] px-4 py-2 flex justify-between items-center">
              <span className=" text-[10px] font-black tracking-widest text-[var(--ink-soft)]">Situation Report</span>
              <div className="flex gap-1">
                {(need.vulnerability || []).map(v => (
                  <span key={v} className="bg-[var(--signal-red)] text-white text-[8px] font-black px-2 py-0.5">{v}</span>
                ))}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-[10px] font-black text-[var(--ink-muted)] mb-2 tracking-widest">Description</h3>
              <p className="text-base font-medium text-[var(--ink)] leading-relaxed mb-8">
                {need.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[var(--border)]">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-[var(--ink-muted)] mb-2 tracking-widest flex items-center gap-2">
                    <MapPin size={14} weight="fill" className="text-[var(--signal-red)]" />
                    Geospatial Pinpoint
                  </h3>
                  <div className="h-[200px] w-full border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] relative overflow-hidden group">
                    {/* #16: null-guard prevents crash when location is missing */}
                    {need.location?.lat && need.location?.lng ? (
                      <MapContainer center={[need.location.lat, need.location.lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full z-0">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[need.location.lat, need.location.lng]} icon={tacticalIcon}>
                          <Popup>Target: {need.title}</Popup>
                        </Marker>
                      </MapContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] font-mono text-[var(--ink-muted)] tracking-widest">No location data</div>
                    )}
                  </div>
                </div>
                {need.evidence_urls?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black text-[var(--ink-muted)] mb-2 tracking-widest">Field Evidence</h3>
                    <div className="flex gap-2 flex-wrap">
                      {need.evidence_urls.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer" className="group">
                          <img src={u} alt="evidence" className="w-16 h-16 object-cover border-2 border-[var(--border)] shadow-[2px_2px_0px_var(--bone-alt)]" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 04: Field Notes SITREP Feed */}
          {(need.field_notes?.length > 0 || isRecording) && (
            <div className="bg-[var(--bone-alt)] border-2 border-[var(--border)] p-4 shadow-[4px_4px_0px_var(--bone-alt)] mt-6">
              <div className="tc-label mb-4 opacity-60">TACTICAL SITREP FEED</div>
              <div className="space-y-4">
                {need.field_notes?.slice().reverse().map(note => (
                  <div key={note.id} className="border-l-4 border-[var(--ink)] pl-4 py-2 bg-[var(--bone)] shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black uppercase text-[var(--ink-soft)]">{note.volunteer_name} • {note.type === 'voice_memo' ? 'VOICE SITREP' : 'TEXT NOTE'}</span>
                      <span className="text-[9px] font-mono opacity-50">{new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="text-sm font-bold text-[var(--ink)] leading-tight">
                      {note.content}
                    </div>
                    {note.full_text && (
                      <details className="mt-2 text-[10px] opacity-60">
                        <summary className="cursor-pointer font-black uppercase hover:text-[var(--signal-red)]">View Full Transcription</summary>
                        <p className="mt-1 font-medium bg-[var(--bone-alt)] p-2 border border-[var(--border)]">{note.full_text}</p>
                      </details>
                    )}
                  </div>
                ))}
                {isRecording && (
                    <div className="flex items-center gap-3 p-3 bg-[var(--signal-red)]/10 border-2 border-[var(--signal-red)] animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-[var(--signal-red)]" />
                        <span className="text-[10px] font-black text-[var(--signal-red)] uppercase tracking-widest">Recording Audio SITREP...</span>
                        <button onClick={() => mediaRecorder?.stop()} className="ml-auto bg-[var(--signal-red)] text-white px-3 py-1 text-[9px] font-black uppercase">STOP</button>
                    </div>
                )}
              </div>
            </div>
          )}

          {/* AI Auditor Module */}
          {need.ai_verification && (
            <div className="bg-blue-50 border-2 border-blue-200 shadow-[4px_4px_0px_rgba(59,130,246,0.1)] p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <ShieldCheck size={20} weight="fill" />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Strategic Verification Badge</span>
                </div>
                <div className="text-3xl font-black text-blue-700">{need.ai_verification.reliability_score}%</div>
              </div>
              {/* #18: removed literal quote text nodes — use expression with null guard */}
              <p className="text-xs font-bold text-blue-900/70 italic bg-white/50 p-3 border-l-4 border-blue-500 mb-4">
                {need.ai_verification?.authenticity_justification || "Verification completed successfully."}
              </p>
              <div className="flex flex-wrap gap-2">
                {(need.ai_verification.detected_items || []).map(item => (
                  <span key={item} className="px-2 py-1 bg-blue-100 text-blue-700 text-[8px] font-black uppercase border border-blue-200">
                    DETECTED: {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tactical Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-[100] md:relative md:z-0 bg-[var(--bone)]/70 backdrop-blur-md md:bg-transparent border-t-2 md:border-t-0 border-[var(--border)] p-3 md:p-0">
            <div className="max-w-screen-xl mx-auto bg-[var(--bone-alt)] border-2 border-[var(--border)] p-1 shadow-[4px_4px_0px_var(--bone-alt)] flex overflow-x-auto no-scrollbar gap-1">
              <button className="shrink-0 min-w-[100px] bg-blue-600 text-white border-2 border-blue-700 px-2 py-3 font-black text-[9px] uppercase flex flex-col items-center gap-1" onClick={handleAiVerify} disabled={verifying}>
                <FileMagnifyingGlass size={14} weight="bold" />
                <span>{verifying ? "Auditing..." : "AI Verify"}</span>
              </button>

              <button 
                className={`shrink-0 min-w-[100px] border-2 px-2 py-3 font-black text-[9px] uppercase flex flex-col items-center gap-1 transition-all ${isRecording ? 'bg-[var(--signal-red)] text-white border-[var(--signal-red)]' : 'bg-[var(--bone)] text-[var(--ink)] border-[var(--border)] hover:bg-[var(--ink)] hover:text-white'}`}
                onClick={isRecording ? () => mediaRecorder?.stop() : startRecording}
              >
                <Microphone size={14} weight="bold" className={isRecording ? 'animate-pulse' : ''} />
                <span>{isRecording ? "Stop Note" : "Record Memo"}</span>
              </button>

              <button className="shrink-0 min-w-[100px] bg-[var(--bone)] border-2 border-[var(--border)] px-2 py-3 text-[9px] font-black uppercase flex flex-col items-center gap-1 hover:bg-[var(--ink)] hover:text-white transition-all" onClick={autoAssign}>
                Auto-Assign
              </button>
              <button className="shrink-0 min-w-[100px] bg-[var(--bone)] text-[var(--ink)] border-2 border-[var(--border)] px-2 py-3 font-black text-[9px] uppercase hover:bg-[var(--ink)] hover:text-white transition-all" onClick={explainMatch} disabled={loading}>
                AI Assist
              </button>
              <button className="shrink-0 min-w-[100px] bg-[var(--bone)] text-[var(--ink)] border-2 border-[var(--border)] px-2 py-3 font-black text-[9px] uppercase" onClick={markComplete}>
                {need.status === 'completed' ? 'Reopen' : 'Close'}
              </button>
            </div>
          </div>

          {user?.role === 'volunteer' && need.status === 'pending' && (
            <button className="w-full bg-green-600 text-white border-2 border-green-700 px-6 py-4 font-black text-xs tracking-widest shadow-[4px_4px_0px_rgba(22,163,74,0.2)]" onClick={claimNeed}>
              Claim Request
            </button>
          )}

          {explain && (
            <div className="bg-white border-2 border-[var(--border)] shadow-[4px_4px_0px_var(--bone-alt)] p-6 italic text-sm">
              <div className="tc-label mb-2 opacity-60">AI MATCHING RATIONALE</div>
              {explain}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          <MissionTimeline need={need} />
          {assignedVol ? (
            <div className="border-2 border-[var(--ink)] p-4 bg-[var(--bone-alt)] shadow-[4px_4px_0px_var(--ink)]">
              <div className="flex items-center gap-4 mb-4 pb-2 border-b border-[var(--ink)]">
                <div className="w-12 h-12 bg-white border-2 border-[var(--ink)] flex items-center justify-center font-black">{assignedVol.name[0]}</div>
                <div>
                  <div className="font-black text-sm">{assignedVol.name}</div>
                  <div className="text-[10px] font-mono opacity-60">ID: {assignedVol.id.split('-')[0]}</div>
                </div>
              </div>
              <Link to={`/volunteers/${assignedVol.id}`} className="w-full block bg-[var(--ink)] text-white text-[10px] font-black py-3 text-center uppercase tracking-widest">
                View Full Record
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map(v => (
                <div key={v.id} className="border-2 border-[var(--border)] p-4 bg-[var(--bone)] shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-black text-sm">{v.name}</div>
                    <div className="text-xl font-black text-[var(--signal-red)]">{v.match_score}</div>
                  </div>
                  <button className="w-full bg-[var(--bone)] border-2 border-[var(--border)] py-2 text-[10px] font-black uppercase hover:bg-[var(--ink)] hover:text-white transition-all" onClick={() => manualAssign(v.id)}>
                    Assign Asset
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
