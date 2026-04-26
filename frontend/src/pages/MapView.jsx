import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MapContainer, TileLayer, CircleMarker, Popup, Rectangle, useMap } from "react-leaflet";
import { Stack, Crosshair, Users, Package, Fire } from "@phosphor-icons/react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";

function HeatmapLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map || points.length === 0) return;
    const heatData = points.map(p => [p.location.lat, p.location.lng, p.priority_score / 100]);
    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 13,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);
    return () => { map.removeLayer(heatLayer); };
  }, [map, points]);
  return null;
}

const urgencyColor = (u) => u >= 5 ? "#E63946" : u === 4 ? "#F59E0B" : u === 3 ? "#3B82F6" : "#10B981";

export default function MapView() {
  const [points, setPoints] = useState([]);
  const [vols, setVols] = useState([]);
  const [resources, setResources] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [filters, setFilters] = useState({ needs: true, volunteers: true, resources: true, heatmap: false });

  const load = async () => {
    const [p, v, r] = await Promise.all([
      api.get("/dashboard/heatmap"), 
      api.get("/volunteers"),
      api.get("/resources")
    ]);
    setPoints(p.data || []); 
    setVols(v.data || []);
    setResources(r.data || []);
  };
  useEffect(() => { load(); }, []);

  const toggleFilter = (k) => setFilters(f => ({ ...f, [k]: !f[k] }));

  const center = points[0] ? [points[0].location.lat, points[0].location.lng] : [28.6139, 77.2090];

  return (
    <div className="p-4 md:p-8 space-y-4 h-[calc(100vh-80px)] flex flex-col" data-testid="map-page">
      <div className="hidden md:block">
        <div className="tc-label">Location Data</div>
        <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Operations Map</h1>
      </div>

      <div className="tc-card p-0 overflow-hidden flex-1 relative flex">
        {/* Command Overlay */}
        <div className={`absolute top-4 right-4 z-[400] bg-[var(--bone)] border-2 border-[var(--ink)] shadow-brutal transition-all duration-300 ${mobileMenuOpen ? "w-64 opacity-100" : "w-10 h-10 opacity-60 md:w-64 md:opacity-100"} overflow-hidden flex flex-col`}>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-2 border-b-2 border-[var(--ink)] p-2 md:cursor-default"
          >
            <Stack weight="fill" size={20} className="shrink-0" />
            <h3 className={`font-heading font-black text-lg transition-opacity ${mobileMenuOpen ? "opacity-100" : "opacity-0 md:opacity-100"}`}>LAYERS</h3>
          </button>
          
          <div className={`p-3 flex flex-col gap-3 transition-opacity ${mobileMenuOpen ? "opacity-100" : "opacity-0 md:opacity-100 hidden md:flex"}`}>
            <button 
              className={`flex items-center justify-between p-2 border-2 ${filters.needs ? 'border-[var(--signal-red)] bg-red-50' : 'border-[var(--ink-soft)] opacity-60'}`}
              onClick={() => toggleFilter('needs')}
            >
              <div className="flex items-center gap-2"><Crosshair size={18} /> <span className="font-bold text-sm">Needs</span></div>
              <span className="font-mono text-xs font-bold">{points.length}</span>
            </button>

            <button 
              className={`flex items-center justify-between p-2 border-2 ${filters.volunteers ? 'border-[var(--ink)] bg-gray-100' : 'border-[var(--ink-soft)] opacity-60'}`}
              onClick={() => toggleFilter('volunteers')}
            >
              <div className="flex items-center gap-2"><Users size={18} /> <span className="font-bold text-sm">Volunteers</span></div>
              <span className="font-mono text-xs font-bold">{vols.length}</span>
            </button>

            <button 
              className={`flex items-center justify-between p-2 border-2 ${filters.resources ? 'border-amber-500 bg-amber-50' : 'border-[var(--ink-soft)] opacity-60'}`}
              onClick={() => toggleFilter('resources')}
            >
              <div className="flex items-center gap-2"><Package size={18} /> <span className="font-bold text-sm">Resources</span></div>
              <span className="font-mono text-xs font-bold">{resources.length}</span>
            </button>

            <button 
              className={`flex items-center justify-between p-2 border-2 ${filters.heatmap ? 'border-red-600 bg-red-100 text-red-900' : 'border-[var(--ink-soft)] opacity-60'}`}
              onClick={() => toggleFilter('heatmap')}
            >
              <div className="flex items-center gap-2"><Fire size={18} /> <span className="font-bold text-sm">Heatmap</span></div>
              <span className="font-mono text-xs font-bold">LIVE</span>
            </button>
          </div>
        </div>

        {/* Map */}
        <MapContainer center={center} zoom={11} className="w-full h-full z-0 flex-1">
          <TileLayer
            attribution='&copy; CartoDB'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          {filters.heatmap && <HeatmapLayer points={points} />}

          {filters.needs && points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.location.lat, p.location.lng]}
              radius={6 + Math.min(p.priority_score / 10, 16)}
              pathOptions={{ color: urgencyColor(p.urgency), fillColor: urgencyColor(p.urgency), fillOpacity: 0.6, weight: 2 }}
            >
              <Popup className="tactical-popup">
                <div style={{fontFamily: "Sora, sans-serif", fontSize: 13}}>
                  <strong className="text-[var(--signal-red)] uppercase">{p.title}</strong><br />
                  <span className="text-xs">{p.category.replace(/_/g, " ")} | Urgency: U{p.urgency}</span><br />
                  <span className="font-mono font-bold mt-1 block border-t pt-1">SCORE: {Math.round(p.priority_score)}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {filters.volunteers && vols.map(v => (
            <CircleMarker
              key={"v"+v.id}
              center={[v.base_location.lat, v.base_location.lng]}
              radius={5}
              pathOptions={{ color: "#2A3D31", fillColor: "#2A3D31", fillOpacity: 0.9, weight: 2 }}
              className="animate-pulse" // Simple ping effect
            >
              <Popup>
                <div style={{fontFamily: "Sora, sans-serif", fontSize: 12}}>
                  <strong className="uppercase">{v.name}</strong><br />
                  Status: <strong>{v.availability}</strong><br />
                  Trust: {Math.round(v.trust_score)}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {filters.resources && resources.map(r => {
            // Rectangle bounds around the lat/lng (simple fake box)
            const lat = Number(r.location?.lat) || 28.6139;
            const lng = Number(r.location?.lng) || 77.2090;
            const size = 0.005;
            return (
              <Rectangle
                key={"r"+r.id}
                bounds={[[lat - size, lng - size], [lat + size, lng + size]]}
                pathOptions={{ color: "#F59E0B", fillColor: "#F59E0B", fillOpacity: 0.5, weight: 2 }}
              >
                <Popup>
                  <div style={{fontFamily: "Sora, sans-serif", fontSize: 12}}>
                    <strong className="uppercase">{r.warehouse}</strong><br />
                    Item: {r.name}<br />
                    Qty: {r.quantity} {r.unit}
                  </div>
                </Popup>
              </Rectangle>
            );
          })}
        </MapContainer>
      </div>

      <div className="flex items-center gap-6 text-xs font-mono tc-card py-2 !mt-4 overflow-x-auto whitespace-nowrap custom-scrollbar">
        <div className="flex items-center gap-2 shrink-0"><span className="w-3 h-3 rounded-full" style={{background:"#E63946"}}></span>U5 critical</div>
        <div className="flex items-center gap-2 shrink-0"><span className="w-3 h-3 rounded-full" style={{background:"#F59E0B"}}></span>U4 high</div>
        <div className="flex items-center gap-2 shrink-0"><span className="w-3 h-3 rounded-full" style={{background:"#3B82F6"}}></span>U3 medium</div>
        <div className="flex items-center gap-2 shrink-0"><span className="w-3 h-3 rounded-full" style={{background:"#10B981"}}></span>U1-U2 low</div>
        <div className="flex items-center gap-2 shrink-0"><span className="w-3 h-3 rounded-sm" style={{background:"#F59E0B"}}></span>Resource Depot</div>
        <div className="flex items-center gap-2 shrink-0"><span className="w-3 h-3 rounded-full border-2 border-[#2A3D31]" style={{background:"transparent"}}></span>Volunteer Ping</div>
      </div>
    </div>
  );
}
