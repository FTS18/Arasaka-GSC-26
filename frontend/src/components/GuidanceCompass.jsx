import React, { useState, useEffect } from 'react';
import { NavigationArrow, Compass } from "@phosphor-icons/react";

export const GuidanceCompass = ({ targetLat, targetLng }) => {
  const [heading, setHeading] = useState(0);
  const [userPos, setUserPos] = useState(null);
  const [bearing, setBearing] = useState(0);
  const [distance, setDistance] = useState(0);

  // Calculate bearing between two points
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
    const x = Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
              Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos((lon2 - lon1) * (Math.PI / 180));
    return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
  };

  // Calculate distance in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  useEffect(() => {
    const handleOrientation = (e) => {
      // Use webkitCompassHeading if available (iOS) or alpha
      const head = e.webkitCompassHeading || (360 - e.alpha);
      setHeading(head);
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    
    const watchId = navigator.geolocation.watchPosition((pos) => {
      setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (userPos && targetLat && targetLng) {
      setBearing(calculateBearing(userPos.lat, userPos.lng, targetLat, targetLng));
      setDistance(calculateDistance(userPos.lat, userPos.lng, targetLat, targetLng));
    }
  }, [userPos, targetLat, targetLng]);

  const arrowRotation = (bearing - heading + 360) % 360;

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-[var(--bone-alt)] border-2 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)]">
      <div className="font-heading font-black text-xs uppercase tracking-widest text-[var(--ink-soft)]">Field Guidance</div>
      
      <div className="relative w-32 h-32 flex items-center justify-center bg-[var(--bone)] border-4 border-[var(--ink)] rounded-full">
        {/* Compass Ring */}
        <div className="absolute inset-2 border-2 border-dashed border-[var(--border)] rounded-full opacity-30 animate-spin-slow" />
        
        {/* Direction Indicator */}
        <div 
          className="transition-transform duration-200 ease-out"
          style={{ transform: `rotate(${arrowRotation}deg)` }}
        >
          <NavigationArrow size={48} weight="fill" className="text-[var(--signal-red)]" />
        </div>
      </div>

      <div className="text-center">
        <div className="font-mono text-2xl font-black tabular-nums tracking-tighter">
          {distance > 1000 ? `${(distance / 1000).toFixed(1)}KM` : `${Math.round(distance)}M`}
        </div>
        <div className="font-mono text-[9px] font-bold uppercase text-[var(--ink-muted)]">Distance to Target</div>
      </div>
    </div>
  );
};
