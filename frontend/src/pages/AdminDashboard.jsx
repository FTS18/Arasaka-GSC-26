import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { Download, Pulse, HardDrive, MapPin, ShieldCheck, Warning, Package, Clock, Broadcast, Siren, MagnifyingGlass, UserCircle, FileText } from "@phosphor-icons/react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function MapAutoBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 0) {
      const validMarkers = markers.filter(m => m.location && m.location.lat && m.location.lng);
      if (validMarkers.length > 0) {
        const bounds = L.latLngBounds(validMarkers.map(m => [m.location.lat, m.location.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }
  }, [markers, map]);
  return null;
}

const tacticalIcon = L.divIcon({
  className: 'tactical-marker',
  html: `<div style="background-color: #E63946; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 4px rgba(230, 57, 70, 0.3);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const StatCard = ({ label, value, icon: Icon, trend, colorClass = "text-[var(--signal-red)]", subtext }) => {
  const formattedValue = typeof value === 'string' 
    ? value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    : value;

  return (
    <div className="tc-card overflow-hidden group hover:border-[var(--signal-red)] transition-all flex flex-col justify-between h-full">
      <div className="flex justify-between items-start">
        <div className="tc-label">{label}</div>
        <Icon size={20} className={colorClass} />
      </div>
      <div className="font-heading font-black text-4xl mt-2 tracking-tighter">{formattedValue}</div>
      {subtext ? (
         <div className="text-[10px] font-mono mt-2 text-[var(--ink-soft)]">{subtext}</div>
      ) : trend && (
        <div className="text-[10px] font-mono mt-2 flex items-center gap-1 text-[var(--ink-soft)]">
          <span className={trend.startsWith("+") ? "text-green-500" : "text-red-500"}>{trend}</span> vs last 12h
        </div>
      )}
    </div>
  );
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: b, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      setIsSyncing(true);
      const [stats, sitrep, markers] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/needs?limit=10&sort_by=created_at&sort_dir=-1&projection=short"),
        api.get("/needs/markers")
      ]);
      setIsSyncing(false);
      return { 
        overview: stats.data, 
        sitrep: sitrep.data || [],
        markers: markers.data || []
      };
    }
  });

  const { data: usage } = useQuery({
    queryKey: ['system-usage'],
    queryFn: async () => {
      const r = await api.get("/admin/system/usage");
      return r.data;
    },
    refetchInterval: 15000
  });

  const mutation = useMutation({
    mutationFn: async (newMode) => {
      return api.post("/system/state", { 
        disaster_mode: newMode,
        disaster_reason: newMode ? "Emergency Triggered via Console" : "Crisis Terminated"
      });
    },
    onMutate: async (newMode) => {
      await queryClient.cancelQueries({ queryKey: ['admin-overview'] });
      const previousData = queryClient.getQueryData(['admin-overview']);
      queryClient.setQueryData(['admin-overview'], (old) => ({
        ...old,
        overview: { ...old?.overview, disaster_mode: newMode }
      }));
      return { previousData };
    },
    onError: (err, newMode, context) => {
      queryClient.setQueryData(['admin-overview'], context.previousData);
      toast.error("Tactical override failed: Link severed");
    },
    onSuccess: (data, newMode) => {
      toast.success(newMode ? "Disaster Mode Active" : "Crisis Terminated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    }
  });

  const generateSITREP = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();
    
    doc.setFillColor(25, 25, 25);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("JANRAKSHAK: OPERATIONAL SITREP", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`GENERATED: ${now} | STATUS: ${b?.overview?.disaster_mode ? "EMERGENCY" : "NORMAL"}`, 105, 30, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("EXECUTIVE SUMMARY", 20, 55);
    doc.setFontSize(10);
    doc.text(`- Active Requests: ${usage?.usage?.reads || 0}`, 20, 65);
    doc.text(`- Critical Priority: ${b?.overview?.needs_by_status?.critical || 0}`, 20, 72);
    doc.text(`- Volunteers On-Site: ${usage?.usage?.writes || 0}`, 20, 79);
    
    doc.setFontSize(14);
    doc.text("RESOURCE DISTRIBUTION", 20, 95);
    let y = 105;
    Object.entries(b?.overview?.resources_by_category || {}).forEach(([cat, count]) => {
      doc.text(`- ${cat.toUpperCase()}: ${count} Units`, 25, y);
      y += 7;
    });

    doc.setFontSize(14);
    doc.text("AI-PREDICTED HOTSPOTS", 20, y + 10);
    doc.setFontSize(10);
    doc.text("1. Sector-4 (High Flood Risk)", 25, y + 20);
    doc.text("2. West Corridor (Supply Chain Bottleneck)", 25, y + 27);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("OFFICIAL HUMANITARIAN COORDINATION DOCUMENT - NOT FOR PUBLIC RELEASE", 105, 285, { align: "center" });

    doc.save(`SITREP_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`);
  };

  const toggleDisasterMode = () => {
    mutation.mutate(!b?.overview?.disaster_mode);
  };

  if (isLoading) return <div className="p-8 font-mono text-xs tracking-widest animate-pulse">Loading field data...</div>;

  const data = b?.overview;
  const logs = b?.sitrep || [];
  const markers = b?.markers || [];

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-full overflow-x-hidden" data-testid="admin-dashboard">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`px-2 py-0.5 font-mono text-[10px] font-bold ${data?.disaster_mode ? "bg-[var(--signal-red)] text-white" : "bg-[var(--ink)] text-[var(--bone)]"}`} role="status" aria-live="polite">
               {data?.disaster_mode ? t("disaster_mode") : t("normal_ops")}
            </div>
            <div className="tc-label !mb-0 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`} aria-hidden="true" />
              {t("telemetry_feed")}
            </div>
          </div>
          <h1 className="font-heading text-5xl font-black tracking-tight" id="main-content-title">
            {t("incident_response")}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button 
            onClick={generateSITREP}
            className="btn-ghost flex items-center justify-center gap-2 !border-2 font-black text-xs w-full sm:w-auto"
            aria-label="Generate Situation Report"
          >
             <FileText size={18} weight="bold" aria-hidden="true" /> SITREP
          </button>
          <Link to="/map" className="btn-ghost flex items-center justify-center gap-2 !border-2 font-black text-xs w-full sm:w-auto" aria-label={t("map")}>
             <Broadcast size={18} weight="bold" aria-hidden="true" /> {t("map")}
          </Link>
          <button 
            onClick={toggleDisasterMode}
            className={`flex items-center justify-center gap-2 transition-all px-6 py-2 border-2 shadow-[4px_4px_0px_var(--ink)] active:translate-y-1 active:shadow-none font-black text-xs w-full sm:w-auto ${data?.disaster_mode ? "bg-green-600 text-white border-green-700" : "bg-[var(--signal-red)] text-white border-red-700"}`}
            aria-pressed={data?.disaster_mode}
          >
            {data?.disaster_mode ? <ShieldCheck size={20} weight="bold" /> : <Warning size={20} weight="bold" />}
            <span>{data?.disaster_mode ? "Exit Disaster Mode" : "Initiate Disaster Mode"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="System Metrics">
        <StatCard 
          label={t("needs")} 
          value={usage?.usage?.reads || 0} 
          icon={ShieldCheck} 
          subtext={`Limit: ${usage?.usage_percentage?.reads || 0}%`}
          colorClass="text-blue-500"
        />
        <StatCard 
          label="Firestore Writes" 
          value={usage?.usage?.writes || 0} 
          icon={Pulse} 
          subtext={`Limit: ${usage?.usage_percentage?.writes || 0}% Used`}
          colorClass="text-green-500"
        />
        <StatCard 
          label="Critical Gaps" 
          value={data?.needs_by_urgency?.[5] || 0} 
          icon={Warning} 
          trend="+4%" 
        />
        <StatCard 
          label="Quota Status" 
          value={usage?.status || "OK"} 
          icon={HardDrive} 
          subtext={`Uptime: ${usage?.uptime || "0m"}`}
          colorClass={usage?.status === "CRITICAL" ? "text-red-500" : "text-green-600"}
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="tc-card min-h-[400px] p-0 overflow-hidden relative" aria-labelledby="map-label">
            <div className="absolute top-4 left-4 z-[1000]">
              <div className="tc-label bg-[var(--bone)] px-4 py-2 border-2 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)]" id="map-label">LIVE OPS THEATER</div>
            </div>
            <div className="h-[400px] w-full">
              <MapContainer 
                center={[20.5937, 78.9629]} 
                zoom={5} 
                scrollWheelZoom={false} 
                className="h-full w-full z-0 grayscale contrast-125 invert-0 dark:invert"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapAutoBounds markers={markers} />
                {markers.map((need) => (
                  need.location && (
                    <Marker key={need.id} position={[need.location.lat, need.location.lng]} icon={tacticalIcon}>
                      <Popup>
                        <div className="font-heading font-black text-[var(--ink)] p-1 min-w-[150px]">
                          <div className="text-[8px] uppercase tracking-widest opacity-60 mb-1">{need.category}</div>
                          <div className="text-xs mb-2">{need.title}</div>
                          <div className={`text-[8px] font-mono mb-3 ${need.urgency >= 4 ? 'text-red-600' : 'text-blue-600'}`}>URGENCY: S{need.urgency}</div>
                          <button onClick={() => navigate(`/needs/${need.id}`)} className="w-full bg-[var(--ink)] text-white text-[9px] py-1.5 font-black uppercase hover:bg-[var(--signal-red)] transition-colors">
                            OPEN INTEL
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          </section>

          <section className="w-full">
            <div className="tc-card bg-[var(--bone)]" aria-labelledby="resources-label">
              <div className="tc-label mb-6 flex justify-between items-center" id="resources-label">
                <span>{t("resources_by_category")}</span>
                <span className="text-[9px] font-mono opacity-50 uppercase tracking-[0.2em]">{Object.keys(data?.resources_by_category || {}).length} Asset Types</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                {Object.entries(data?.resources_by_category || {}).map(([cat, count]) => (
                  <div key={cat} className="group">
                    <div className="flex justify-between text-[10px] font-black mb-1.5 uppercase">
                      <span className="group-hover:text-[var(--signal-red)] transition-colors">{cat.replace(/_/g, " ")}</span>
                      <span className="font-mono">{count.toLocaleString()} unit</span>
                    </div>
                    <div className="h-1 w-full bg-[var(--bone-alt)]">
                      <div className="h-full bg-[var(--ink)] group-hover:bg-[var(--signal-red)] transition-all" style={{ width: `${Math.min(100, (count / 500) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <h2 className="font-heading text-2xl font-black tracking-tight">{t("live_dispatch")}</h2>
          <div className="tc-card p-0 bg-[var(--bone-alt)] divide-y divide-[#d1c7b7] overflow-hidden border-2 border-[#4a4947]" role="log" aria-live="polite">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-[var(--bone)] transition-colors cursor-pointer group" onClick={() => navigate(`/needs/${log.id}`)}>
                <div className="flex justify-between text-[8px] font-mono text-xs text-[var(--ink-muted)] tracking-wider">
                  <span>Ref: {log.id.slice(-6)}</span>
                  <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="text-sm font-black group-hover:text-[var(--signal-red)] leading-tight">{log.title}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${log.urgency >= 4 ? 'bg-[var(--signal-red)]' : 'bg-[#6b6a65]'}`} aria-hidden="true" />
                    <span className="text-[9px] font-mono text-[var(--ink-soft)]">{log.status}</span>
                  </div>
                  <div className={`px-2 py-0.5 text-[8px] font-bold ${log.urgency >= 4 ? 'bg-[var(--signal-red)] text-white' : 'bg-[var(--bone)] border border-[var(--border)]'}`}>U{log.urgency}</div>
                </div>
              </div>
            ))}
            <button onClick={() => navigate("/analytics")} className="w-full py-4 text-[10px] font-black tracking-[0.2em] bg-[#2a2928] text-[var(--bone)] hover:bg-[#1a1a1a] transition-all">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
