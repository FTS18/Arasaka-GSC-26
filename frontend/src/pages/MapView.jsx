import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const urgencyColor = (u) => u >= 5 ? "#E63946" : u === 4 ? "#F59E0B" : u === 3 ? "#3B82F6" : "#10B981";

export default function MapView() {
  const [points, setPoints] = useState([]);
  const [vols, setVols] = useState([]);

  const load = async () => {
    const [p, v] = await Promise.all([api.get("/dashboard/heatmap"), api.get("/volunteers")]);
    setPoints(p.data); setVols(v.data);
  };
  useEffect(() => { load(); }, []);

  const center = points[0] ? [points[0].location.lat, points[0].location.lng] : [28.6139, 77.2090];

  return (
    <div className="p-6 md:p-8 space-y-4" data-testid="map-page">
      <div>
        <div className="overline">Geospatial Intel</div>
        <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Live Map</h1>
      </div>

      <div className="tc-card p-0 overflow-hidden">
        <MapContainer center={center} zoom={11} style={{ height: "70vh", width: "100%" }}>
          <TileLayer
            attribution='&copy; CartoDB'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.location.lat, p.location.lng]}
              radius={6 + Math.min(p.priority_score / 10, 16)}
              pathOptions={{ color: urgencyColor(p.urgency), fillColor: urgencyColor(p.urgency), fillOpacity: 0.6, weight: 2 }}
            >
              <Popup>
                <div style={{fontFamily: "JetBrains Mono, monospace", fontSize: 12}}>
                  <strong>{p.title}</strong><br />
                  Category: {p.category}<br />
                  Urgency: U{p.urgency} · Score: {Math.round(p.priority_score)}
                </div>
              </Popup>
            </CircleMarker>
          ))}
          {vols.map(v => (
            <CircleMarker
              key={"v"+v.id}
              center={[v.base_location.lat, v.base_location.lng]}
              radius={5}
              pathOptions={{ color: "#2A3D31", fillColor: "#2A3D31", fillOpacity: 0.9, weight: 1 }}
            >
              <Popup>
                <div style={{fontFamily: "JetBrains Mono, monospace", fontSize: 12}}>
                  <strong>{v.name}</strong><br />
                  Trust: {Math.round(v.trust_score)} · {v.availability}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:"#E63946"}}></span>U5 critical</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:"#F59E0B"}}></span>U4 high</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:"#3B82F6"}}></span>U3 medium</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:"#10B981"}}></span>U1-U2 low</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:"#2A3D31"}}></span>Volunteers</div>
      </div>
    </div>
  );
}
