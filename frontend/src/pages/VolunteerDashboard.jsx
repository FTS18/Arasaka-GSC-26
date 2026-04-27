import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Download, DownloadSimple, Camera, NavigationArrow, CheckCircle, Warning, ArrowsClockwise, UserCircle, MapPin, WifiSlash } from "@phosphor-icons/react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { jsPDF } from "jspdf";
import SEO from "@/components/SEO";
import { queueAction, processSyncQueue, getPendingActions } from "@/lib/syncQueue";
import { Skeleton } from "@/components/ui/skeleton";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-12 text-center space-y-4">
          <div className="tc-label !text-[var(--signal-red)]">Critical Unit Failure</div>
          <h1 className="font-heading text-3xl font-black">TACTICAL OVERFLOW</h1>
          <p className="text-xs font-mono opacity-50 max-w-md mx-auto">The situational interface encountered an unrecoverable exception. Emergency protocols active.</p>
          <button onClick={() => window.location.reload()} className="btn-hard !bg-[var(--signal-red)] !text-white">REBOOT CONSOLE</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SystemStatus = ({ online }) => (
  <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bone-alt)] border border-[var(--border)] rounded-full">
    <div className={`w-2 h-2 rounded-full ${online ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-[var(--signal-red)]"}`} />
    <span className="text-[10px] font-mono font-bold tracking-tighter opacity-70">{online ? "LINK ACTIVE" : "LINK LOST"}</span>
  </div>
);

// Stable seed so chart doesn't shake on every re-render
const SPARK_SEED = [...Array(12)].map((_, i) => ({ val: [18,22,15,28,12,25,20,30,17,24,19,26][i] }));

const Spark = ({ color }) => (
  <div className="tc-sparkline-container -mx-6 -mb-6 h-16 opacity-50 min-w-0 overflow-hidden">
    <ResponsiveContainer width="99%" height="99%" minWidth={0} minHeight={0}>
      <AreaChart data={SPARK_SEED}>
        <Area type="monotone" dataKey="val" stroke={color} fill={color} fillOpacity={0.05} strokeWidth={1} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const Stat = ({ label, value, variant }) => (
  <div className="tc-card overflow-hidden flex flex-col justify-between min-h-[130px]">
    <div>
      <div className="tc-label">{label}</div>
      <div className="font-heading font-black text-3xl mt-3 tracking-tight">{value}</div>
    </div>
    <Spark color={variant === "crit" ? "var(--signal-red)" : "var(--ink-soft)"} />
  </div>
);

export default function VolunteerDashboardPage() {
  return (
    <ErrorBoundary>
      <VolunteerDashboardContent />
    </ErrorBoundary>
  );
}

function VolunteerDashboardContent() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [missions, setMissions] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [briefs, setBriefs] = useState({});
  const [briefLoading, setBriefLoading] = useState(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    const checkSync = async () => {
      const pending = await getPendingActions();
      setPendingSyncCount(pending.length);
    };
    checkSync();
    
    const handleOnline = async () => {
      toast.success("Connection Restored. Syncing field data...");
      const synced = await processSyncQueue(api);
      if (synced > 0) {
        toast.success(`Synced ${synced} tactical updates.`);
        load();
      }
      setPendingSyncCount(0);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [m, n, vProfile, lb] = await Promise.all([
        api.get("/missions"),
        api.get("/needs?limit=20"),
        api.get("/volunteers/me"),
        api.get("/volunteers/leaderboard")
      ]);
      setMissions(m.data || []);
      setNeeds(n.data || []);
      setStats({ loaded: true });
      setProfile(vProfile.data || null);
      setLeaderboard(lb.data || []);
    } catch (err) {
      toast.error("Telemetry link unstable. dashboard data might be stale.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const intervalId = setInterval(load, 30000);
    return () => clearInterval(intervalId);
  }, [user?.id]);

  const myMissions = useMemo(() => {
    // #28: server uses assigned_volunteer_ids, not volunteer_ids
    return (missions || []).filter((m) => (m.assigned_volunteer_ids || m.volunteer_ids || []).includes(profile?.id));
  }, [missions, profile?.id]);

  const nearbyOpportunities = useMemo(() => {
    return (needs || [])
      .filter((n) => n.status === "pending")
      .slice(0, 8);
  }, [needs]);

  const handleUpload = async (missionId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const t = toast.loading("Uploading proof...");
    try {
      const url = await uploadToCloudinary(file);
      await api.patch(`/missions/${missionId}`, { proof_urls: [url] });
      toast.success("Proof uploaded successfully", { id: t });
      load();
    } catch {
      toast.error("Upload failed", { id: t });
    }
  };

  const startMission = async (missionId) => {
    const t = toast.loading("Starting mission...");
    try {
      await api.post(`/missions/${missionId}/accept`);
      toast.success("Mission active", { id: t });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Unable to start", { id: t });
    }
  };

  const loadBrief = async (missionId, force = false) => {
    setBriefLoading(missionId);
    try {
      const r = await api.post(`/missions/${missionId}/brief`, { refresh: force });
      setBriefs((prev) => ({ ...prev, [missionId]: r.data.brief }));
    } catch {
      toast.error("Brief generation failed");
    } finally {
      setBriefLoading(null);
    }
  };

  const markComplete = async (mid) => {
    const tNotify = toast.loading("Finalizing mission...");
    try {
      await api.post(`/missions/${mid}/complete`, {});
      toast.success(t("operation_complete") || "Mission completed!", { id: tNotify });
      mutate();
    } catch (err) {
      if (!navigator.onLine || err.message === 'Network Error') {
        await queueAction({ type: 'MISSION_COMPLETE', mid, payload: {} });
        setPendingSyncCount(prev => prev + 1);
        toast.success("Mission saved to Offline Queue", { id: tNotify });
        // Optimistic UI for completion while offline
        mutate();
      } else {
        toast.error(err.response?.data?.detail || "Completion failed", { id: tNotify });
      }
    }
  };

  const getRank = (p) => {
    if (!p) return t('rank_rookie');
    if (p.completed_missions >= 20) return t('rank_commander');
    if (p.completed_missions >= 10) return t('rank_veteran');
    if (p.completed_missions >= 5) return t('rank_expert');
    return t('rank_first_responder');
  };

  const toggleStatus = async () => {
    const old = profile?.availability;
    const next = old === 'available' ? 'busy' : 'available';
    setProfile(p => ({ ...p, availability: next }));
    try {
      await api.patch('/volunteers/me/status', { availability: next });
      toast.success(t('status_updated'));
    } catch (err) {
      if (!navigator.onLine || err.message === 'Network Error') {
        await queueAction({ type: 'STATUS_TOGGLE' });
        setPendingSyncCount(prev => prev + 1);
        toast.success("Status update queued for sync");
      } else {
        setProfile(p => ({ ...p, availability: old }));
        toast.error(t('update_failed'));
      }
    }
  };

  const generateCertificate = () => {
    if (!profile) return;
    const doc = new jsPDF("landscape");
    doc.setFillColor(25, 25, 25);
    doc.rect(0, 0, 297, 210, "F");
    
    doc.setTextColor(220, 243, 101); // Lime accent
    doc.setFontSize(40);
    doc.text("CERTIFICATE OF SERVICE", 148, 50, { align: "center" });
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("THIS ACKNOWLEDGES THAT", 148, 80, { align: "center" });
    
    doc.setFontSize(30);
    doc.setTextColor(220, 243, 101);
    doc.text(profile.name.toUpperCase(), 148, 110, { align: "center" });
    
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(16);
    doc.text(`HAS SUCCESSFULLY COMPLETED ${profile.completed_missions} HUMANITARIAN MISSIONS`, 148, 140, { align: "center" });
    doc.text(`TRUST SCORE: ${Math.round(profile.trust_score)}% | RANK: ${getRank(profile)}`, 148, 160, { align: "center" });
    
    doc.setFontSize(12);
    doc.text("JANRAKSHAK COMMAND SYSTEM", 148, 190, { align: "center" });
    
    doc.save(`Janrakshak_Certificate_${profile.name}.pdf`);
  };

  const claimMission = async (nid) => {
    const originalNeeds = [...needs];
    setNeeds(prev => prev.filter(n => n.id !== nid));
    const toastId = toast.loading(t('claiming') || "Claiming...");
    try {
      await api.post(`/needs/${nid}/claim`);
      toast.success(t('mission_claimed') || "Mission Claimed", { id: toastId });
      load();
    } catch (e) {
      if (!navigator.onLine || e.message === 'Network Error') {
        await queueAction({ type: 'MISSION_CLAIM', nid });
        setPendingSyncCount(prev => prev + 1);
        toast.success("Claim saved to Offline Queue", { id: toastId });
      } else {
        setNeeds(originalNeeds);
        toast.error(e.response?.data?.detail || t('claim_failed'), { id: toastId });
      }
    }
  };

  if (!stats && loading) return (
    <div className="p-6 space-y-8 animate-pulse">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7 space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
        <div className="col-span-5 space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="volunteer-dashboard-page">
      <SEO title={t("dashboard")} />
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="tc-label">{t("field_ops") || "Field Operations"}</div>
          <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">{t("dashboard")}</h1>
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          {pendingSyncCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--signal-red)] text-white text-[10px] font-bold rounded uppercase tracking-widest animate-pulse">
              <WifiSlash size={14} weight="bold" /> {pendingSyncCount} UNSYNCED ACTIONS
            </div>
          )}
          <SystemStatus online={stats?.loaded && navigator.onLine} />
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <Link to="/map" className="btn-hard !bg-white !text-[var(--ink)] w-full sm:w-auto text-center" aria-label={t("view_map")}>{t("view_map")}</Link>
            <Link to="/missions" className="btn-primary tracking-tighter w-full sm:w-auto text-center" aria-label={t("all_assignments")}>{t("all_assignments")}</Link>
          </div>
        </div>
      </div>

      {/* Impact Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-hidden" role="region" aria-label="Impact Metrics">
        <Stat label={t("trust_score")} value={profile?.trust_score ? Math.round(profile?.trust_score) : 0} variant={profile?.trust_score < 70 ? "crit" : ""} />
        <Stat label={t("completed")} value={profile?.completed_missions || 0} />
        <div className="tc-card p-4 relative group cursor-pointer hover:bg-[var(--bone-alt)] transition-colors flex flex-col justify-between min-h-[130px]" onClick={toggleStatus} role="button" aria-label="Toggle availability">
          <div className="tc-label">{t("status")}</div>
          <div className={`font-heading text-3xl font-black ${profile?.availability !== "available" ? "text-[var(--signal-red)]" : "text-green-600"}`}>
            {t((profile?.availability || "available").toLowerCase())}
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowsClockwise size={12} className="animate-spin-slow" />
          </div>
        </div>
        <div className="tc-card flex flex-col justify-between min-h-[130px]">
          <div className="tc-label">{t("rank")}</div>
          <div className="font-heading font-black text-xl italic text-[var(--signal-red)] leading-tight">{getRank(profile)}</div>
          <Spark color="var(--signal-red)" opacity={0.1} />
        </div>
        <div className="tc-card overflow-hidden bg-[var(--ink)] text-[var(--bone)] flex flex-col justify-between p-4 min-h-[130px]">
          <div className="tc-label !text-[var(--signal-red)]">{t("recognition") || "Recognition"}</div>
          <div className="text-[10px] opacity-60 font-mono tracking-tighter leading-tight mb-2">Validated mission honors generated by tactical command.</div>
          <button onClick={generateCertificate} className="btn-hard !bg-[var(--signal-red)] !text-[var(--ink)] w-full !py-2 flex items-center justify-center gap-2 text-xs">
            <Download weight="bold" size={14} /> {t("certificate") || "Certificate"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full max-w-full overflow-hidden">
        {/* Mission Focus */}
        <div className="md:col-span-7 space-y-6 min-w-0" role="region" aria-labelledby="assignments-heading">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-black tracking-tight" id="assignments-heading">{t("active_assignments")}</h2>
            <div className="tc-label" aria-live="polite">Live</div>
          </div>
          
          <div className="space-y-4">
            {myMissions.filter(m => m.status !== "completed").map((m) => (
              <div key={m.id} className="tc-card border-l-4 border-l-[var(--signal-red)] bg-white shadow-xl max-w-full overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className=" font-mono text-[10px] text-[var(--ink-muted)] tracking-widest">{t('assignment')} ID: {m.id.slice(0, 8)}</div>
                    <div className="font-heading font-extrabold text-2xl mt-1">{m.need_ids.length} {t('critical_needs')}</div>
                  </div>
                  <span className="tc-badge text-[var(--signal-red)]">{t((m.status || "planned").toLowerCase())}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${m.route?.[0]?.lat ?? m.coordinates?.lat ?? 0},${m.route?.[0]?.lng ?? m.coordinates?.lng ?? 0}${m.route?.[0]?.address ? `&destination_place_id=${encodeURIComponent(m.route[0].address)}` : ''}`}
                    target="_blank" rel="noreferrer"
                    className="btn-hard py-4 font-black flex items-center justify-center gap-2"
                    aria-label={`${t('navigate')} to ${m.route?.[0]?.address || 'mission location'}`}
                  >
                    <NavigationArrow size={20} weight="fill" /> {t('navigate') || "Navigate"}
                  </a>
                  <label className="btn-hard bg-white py-4 font-black flex items-center justify-center gap-2 cursor-pointer border-2 hover:bg-[var(--ink)] hover:text-[var(--bone)] transition-all">
                    <Camera size={20} weight="bold" /> {t('add_proof') || "Add Proof"}
                    <input type="file" className="hidden" onChange={(e) => handleUpload(m.id, e)} accept="image/*" capture="environment" />
                  </label>
                </div>

                <div className="flex gap-2">
                    <button
                      onClick={() => loadBrief(m.id)}
                      className="btn-ghost flex-1 mt-3 py-3 font-black text-sm tracking-tighter flex items-center justify-center gap-2"
                      aria-label={t('mission_brief')}
                      disabled={briefLoading === m.id}
                    >
                      {briefLoading === m.id ? t('loading') : t('mission_brief')}
                    </button>
                  {briefs[m.id] && (
                    <button
                      onClick={() => loadBrief(m.id, true)}
                      className="btn-ghost border-[var(--border)] mt-3 p-3 flex items-center justify-center"
                      title="Force Refresh Brief"
                    >
                      <NavigationArrow size={14} className="rotate-45" />
                    </button>
                  )}
                </div>

                {briefs[m.id] && (
                  <div className="mt-3 text-xs whitespace-pre-wrap border-t border-[var(--border)] pt-3 text-[var(--ink)]">
                    {briefs[m.id]}
                  </div>
                )}

                {m.status !== "in_progress" && (
                  <button
                    onClick={() => startMission(m.id)}
                    className="btn-ghost w-full mt-3 py-3 font-black text-sm tracking-tighter flex items-center justify-center gap-2"
                    aria-label="Start mission"
                  >
                    {t('start_mission')}
                  </button>
                )}

                <button 
                  onClick={() => markComplete(m.id)}
                  className="btn-primary w-full mt-3 py-4 font-black text-lg tracking-tighter flex items-center justify-center gap-2"
                  aria-label={t("mark_complete")}
                >
                  <CheckCircle size={22} weight="bold" /> {t("mark_complete")}
                </button>
              </div>
            ))}
            {myMissions.filter(m => m.status !== "completed").length === 0 && (
              <div className="tc-card border-dashed bg-transparent text-center py-12">
                <div className="font-mono text-sm text-[var(--ink-soft)] tracking-widest">{t('no_active_assignments') || "No active assignments"}</div>
                <p className="text-xs text-[var(--ink-muted)] mt-2">{t('claim_opportunity_prompt') || "Claim a request from the opportunities list below to get started."}</p>
              </div>
            )}
          </div>

          <h2 className="font-heading text-2xl font-black tracking-tight pt-4" id="opportunities-heading">{t("nearby_opportunities")}</h2>
          <div className="tc-card divide-y divide-[var(--border)] p-0 overflow-hidden" role="list" aria-labelledby="opportunities-heading">
            {nearbyOpportunities.map(n => (
              <div key={n.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bone-alt)] transition-colors group">
                <div className="font-mono font-bold text-[var(--signal-red)] text-lg">U{n.urgency}</div>
                <Link to={`/needs/${n.id}`} className="flex-1 min-w-0">
                  <div className="font-bold text-sm group-hover:text-[var(--signal-red)] truncate">{n.title}</div>
                  <div className=" text-[10px] font-mono text-[var(--ink-muted)] tracking-wider truncate">{n.category.replace(/_/g, " ")} · {n.people_affected} affected</div>
                </Link>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => claimMission(n.id)}
                     disabled={profile?.availability !== "available"}
                     className="btn-primary !py-2 px-4 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                     title={profile?.availability !== "available" ? t('status_check_required') : ""}
                   >
                     {t('claim') || "Claim"}
                   </button>
                   <MapPin size={18} className="text-[var(--border)] group-hover:text-[var(--signal-red)]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Field Briefing & Manual */}
        <div className="md:col-span-5 space-y-6 min-w-0" role="region" aria-labelledby="status-heading">
          <h2 className="font-heading text-2xl font-black mb-6" id="status-heading">{t("status")}</h2>
          <div className="tc-table-container">
            <table className="w-full">
              <thead>
                <tr className="tc-table-header text-left">
                  <th className="p-4 w-1/2">Assigned Task</th>
                  <th className="p-4">Urgency</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {myMissions.map((task) => (
                  <tr key={task.id} className="hover:bg-[var(--bone-alt)] transition-colors group">
                    <td className="p-4">
                      <div className="font-bold">{task.title || "Mission Task"}</div>
                      <div className="text-[10px] font-mono text-[var(--ink-soft)]  tracking-wider">ID: {task.id.slice(0, 6)}</div>
                    </td>
                    <td className="p-4">
                      <span className={`tc-badge ${task.status === "pending" ? "tc-badge-crit" : "tc-badge-outl"}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link to="/missions" className="text-[10px] font-black underline underline-offset-4 hover:text-[var(--signal-red)]">View Status →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tc-card bg-[var(--ink)] text-[var(--bone)]">
            <div className="tc-label text-[var(--signal-red)]">Field Manual</div>
            <div className="text-sm font-bold mt-2 italic">"Efficiency saves lives. Always upload clear proof of resolution."</div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-[10px] font-mono tracking-widest text-[#AAA]">
              <div>• Check navigation</div>
              <div>• Verify resources</div>
              <div>• Ensure safety</div>
              <div>• Log completion</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
