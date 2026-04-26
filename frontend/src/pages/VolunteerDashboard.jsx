import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { NavigationArrow, Camera, CheckCircle, Warning, MapPin, Download } from "@phosphor-icons/react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { jsPDF } from "jspdf";

const Spark = ({ color }) => {
  const data = [...Array(12)].map((_, i) => ({ val: Math.floor(Math.random() * 20) + 10 }));
  return (
    <div className="tc-sparkline-container -mx-6 -mb-6 h-16 opacity-50">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey="val" stroke={color} fill={color} fillOpacity={0.05} strokeWidth={1} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const Stat = ({ label, value, variant }) => (
  <div className="tc-card overflow-hidden">
    <div className="tc-label">{label}</div>
    <div className="font-mono font-bold text-3xl mt-3 tracking-tight">{value}</div>
    <Spark color={variant === "crit" ? "var(--signal-red)" : "var(--ink-soft)"} />
  </div>
);

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [missions, setMissions] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const load = async () => {
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
        // console.error("Board error:", err);
        // Silent error for better UX, or toast if absolutely critical
      }
    };

    load();
    const intervalId = setInterval(load, 30000);
    return () => clearInterval(intervalId);
  }, [user?.id]);

  const myMissions = useMemo(() => {
    return missions.filter((m) => (m.volunteer_ids || []).includes(profile?.id));
  }, [missions, profile?.id]);

  const nearbyOpportunities = useMemo(() => {
    return needs
      .filter((n) => n.status === "pending")
      .slice(0, 6);
  }, [needs]);

  const handleUpload = async (missionId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const t = toast.loading("Uploading proof...");
    try {
      const url = await uploadToCloudinary(file);
      await api.patch(`/missions/${missionId}`, { proof_urls: [url] });
      toast.success("Proof uploaded successfully", { id: t });
    } catch {
      toast.error("Upload failed", { id: t });
    }
  };

  const markComplete = async (mid) => {
    const t = toast.loading("Finalizing mission...");
    try {
      await api.post(`/missions/${mid}/complete`, {});
      toast.success("Mission completed!", { id: t });
      // Reload is handled by interval, or we could manually refresh
    } catch (err) {
      toast.error(err.response?.data?.detail || "Completion failed", { id: t });
    }
  };

  const getRank = (p) => {
    if (!p) return "Rookie";
    if (p.completed_missions >= 20) return "Field Commander";
    if (p.completed_missions >= 10) return "Veteran Responder";
    if (p.completed_missions >= 5) return "Logistics Expert";
    return "First Responder";
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

  if (!stats) return <div className="p-8 font-mono text-xs tracking-widest animate-pulse">Loading field data...</div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-full overflow-x-hidden" data-testid="volunteer-dashboard-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="tc-label">{t("field_ops") || "Field Operations"}</div>
          <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">{t("dashboard")}</h1>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <Link to="/map" className="btn-hard !bg-white !text-[var(--ink)] w-full sm:w-auto text-center" aria-label={t("view_map")}>{t("view_map")}</Link>
          <Link to="/missions" className="btn-primary tracking-tighter w-full sm:w-auto text-center" aria-label={t("all_assignments")}>{t("all_assignments")}</Link>
        </div>
      </div>

      {/* Impact Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-hidden" role="region" aria-label="Impact Metrics">
        <Stat label={t("trust_score")} value={profile?.trust_score ? Math.round(profile?.trust_score) : 0} variant={profile?.trust_score < 70 ? "crit" : ""} />
        <Stat label={t("completed")} value={profile?.completed_missions || 0} />
        <Stat label={t("status")} value={t((profile?.availability || "available").toLowerCase()) || (profile?.availability || "available")} variant={profile?.availability !== "available" ? "crit" : ""} />
        <Stat label="Rank" value={getRank(profile)} />
        <div className="tc-card overflow-hidden bg-[var(--ink)] text-[var(--bone)] flex flex-col justify-between p-4">
          <div className="tc-label !text-[var(--signal-red)]">Recognition</div>
          <button onClick={generateCertificate} className="btn-hard !bg-[var(--signal-red)] !text-[var(--ink)] w-full mt-2 !py-2 flex items-center justify-center gap-2 text-xs">
            <Download weight="bold" size={14} /> Certificate
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
                    <div className=" font-mono text-[10px] text-[var(--ink-muted)] tracking-widest">Assignment ID: {m.id.slice(0, 8)}</div>
                    <div className="font-heading font-extrabold text-2xl mt-1">{m.need_ids.length} Urgent Requests</div>
                  </div>
                  <span className="tc-badge text-[var(--signal-red)]">In Progress</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=28.61,77.21`} 
                    target="_blank" rel="noreferrer"
                    className="btn-hard py-4 font-black flex items-center justify-center gap-2"
                  >
                    <NavigationArrow size={20} weight="fill" /> Navigate
                  </a>
                  <label className="btn-hard bg-white py-4 font-black flex items-center justify-center gap-2 cursor-pointer border-2 hover:bg-[var(--ink)] hover:text-[var(--bone)] transition-all">
                    <Camera size={20} weight="bold" /> Add Proof
                    <input type="file" className="hidden" onChange={(e) => handleUpload(m.id, e)} accept="image/*" capture="environment" />
                  </label>
                </div>

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
                <div className=" font-mono text-sm text-[var(--ink-soft)] tracking-widest">No active assignments</div>
                <p className="text-xs text-[var(--ink-muted)] mt-2 italic">Updating available requests...</p>
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
                     onClick={async () => {
                        const t = toast.loading("Claiming...");
                        try {
                          await api.post(`/needs/${n.id}/claim`);
                          toast.success("Mission Claimed", { id: t });
                          window.location.reload(); // Refresh to update mission list
                        } catch (e) {
                          toast.error(e.response?.data?.detail || "Claim failed", { id: t });
                        }
                     }}
                     className="bg-green-600 text-white px-4 py-1.5 text-[10px] font-black hover:bg-green-500 transition-all shadow-[2px_2px_0px_rgba(22,163,74,0.2)]"
                   >
                     Claim
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
                  <th className="p-4">Assigned Task</th>
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
                      <Link to={`/missions/${task.id}`} className="text-[10px] font-black underline underline-offset-4 hover:text-[var(--signal-red)]">Operate →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tc-card bg-[var(--ink)] text-[var(--bone)]">
            <div className="tc-label text-[var(--signal-red)]">Field Manual</div>
            <div className="text-sm font-bold mt-2 italic">"Efficiency saves lives. Always upload clear proof of resolution."</div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-[10px] font-mono  tracking-widest text-[var(--ink-muted)]">
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
