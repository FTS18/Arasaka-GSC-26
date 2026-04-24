import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const DisasterCtx = createContext(null);
export const useDisaster = () => useContext(DisasterCtx);

export const DisasterProvider = ({ children }) => {
  const [state, setState] = useState({ disaster_mode: false, disaster_reason: null });

  const load = useCallback(async () => {
    try {
      const r = await api.get("/disaster/state");
      setState(r.data);
      document.body.classList.toggle("disaster-mode", r.data.disaster_mode);
    } catch {}
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 20000); return () => clearInterval(i); }, [load]);

  const toggle = async (enabled, reason) => {
    const r = await api.post("/disaster/toggle", { enabled, reason });
    setState({ disaster_mode: r.data.disaster_mode, disaster_reason: r.data.disaster_reason });
    document.body.classList.toggle("disaster-mode", r.data.disaster_mode);
  };

  return <DisasterCtx.Provider value={{ ...state, toggle, refresh: load }}>{children}</DisasterCtx.Provider>;
};
