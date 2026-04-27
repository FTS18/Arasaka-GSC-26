import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useDisaster } from "@/context/DisasterContext";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getQueuedRequests, clearQueuedRequests } from "@/lib/idb";
import { getDashboardPathForRole } from "@/lib/roleRoutes";
import { 
  SquaresFour, Warning, Users, Package, MapTrifold, ChartLine,
  ClipboardText, SignOut, Translate, Siren, Radio,
  List, Gear, CaretLeft, MagnifyingGlass, X as CloseIcon, Sun, Moon, Microphone, MicrophoneSlash
} from "@phosphor-icons/react";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";

const SearchModal = ({ open, setOpen, navItems, navigate }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ nav: [], needs: [], missions: [], volunteers: [] });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      setQuery("");
      const fetchSearchData = async () => {
        setLoading(true);
        try {
          const canSeeMissions = user?.role === "admin" || user?.role === "volunteer";
          const [n, m, vInfo] = await Promise.all([
            api.get("/needs?limit=20"),
            canSeeMissions ? api.get("/missions?limit=20") : Promise.resolve({ data: [] }),
            canSeeMissions ? api.get("/volunteers?limit=20") : Promise.resolve({ data: [] })
          ]);
          setResults({ 
            nav: navItems,
            needs: n.data || [], 
            missions: m.data || [], 
            volunteers: vInfo.data || [] 
          });
        } catch (e) {} finally { setLoading(false); }
      };
      fetchSearchData();
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return { nav: navItems, needs: [], missions: [], volunteers: [] };
    
    return {
      nav: navItems.filter(i => i.name.toLowerCase().includes(q)),
      needs: results.needs.filter(n => n.title.toLowerCase().includes(q) || n.id.includes(q)),
      missions: results.missions.filter(m => m.id.includes(q) || (m.title || m.description || "").toLowerCase().includes(q)), // #25: search by title too
      volunteers: results.volunteers.filter(v => v.name.toLowerCase().includes(q))
    };
  }, [query, results, navItems]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 backdrop-blur-sm bg-black/20">
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-2xl bg-[var(--bone)] border-2 border-[var(--border-strong)] shadow-[12px_12px_0px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b-2 border-[var(--border)] flex items-center gap-3 bg-[var(--bone-alt)]">
          <MagnifyingGlass size={24} weight="bold" className="text-[var(--ink-muted)]" />
          <input
            autoFocus
            placeholder="Search missions, volunteers, or commands..."
            className="flex-1 bg-transparent border-none outline-none font-heading text-xl font-bold placeholder:opacity-30 text-[var(--ink)]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          />
          {loading && <div className="w-4 h-4 border-2 border-[var(--signal-red)] border-t-transparent rounded-full animate-spin" />}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Navigation Commands */}
          {filtered.nav.length > 0 && (
            <section>
              <div className="tc-label !text-[var(--ink-soft)] mb-3 uppercase tracking-[0.2em]">Commands</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filtered.nav.map(item => (
                  <button key={item.path} onClick={() => { navigate(item.path); setOpen(false); }} className="flex items-center justify-between p-3 bg-[var(--bone-alt)] hover:bg-[var(--ink)] hover:text-[var(--bone)] transition-all group border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <item.icon size={16} weight="bold" className="group-hover:text-[var(--signal-red)]" />
                      <span className="text-xs font-black tracking-tight">{item.name}</span>
                    </div>
                    <span className="text-[8px] font-mono opacity-50 group-hover:opacity-100">EXEC →</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Records */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.needs.length > 0 && (
              <section>
                <div className="tc-label !text-[var(--signal-red)] mb-3">Requests</div>
                <div className="space-y-2">
                  {filtered.needs.map(n => (
                    <button key={n.id} onClick={() => { navigate(`/needs/${n.id}`); setOpen(false); }} className="w-full text-left p-2 hover:bg-white border-b border-[#d1c7b7]/30 transition-all group">
                      <div className="text-[10px] font-bold group-hover:text-[var(--signal-red)] truncate">{n.title}</div>
                      <div className="text-[8px] font-mono opacity-50">REF: {n.id.slice(0,8)}</div>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {filtered.volunteers.length > 0 && (
              <section>
                <div className="tc-label !text-blue-700 mb-3">Personnel</div>
                <div className="space-y-2">
                  {filtered.volunteers.map(v => (
                    <button key={v.id} onClick={() => { navigate(`/volunteers/${v.id}`); setOpen(false); }} className="w-full text-left p-2 hover:bg-white border-b border-[#d1c7b7]/30 transition-all group">
                      <div className="text-[10px] font-bold group-hover:text-blue-700">{v.name}</div>
                      <div className="text-[8px] font-mono opacity-50 capitalize">{v.role} · TS: {Math.round(v.trust_score)}%</div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-[var(--ink)] text-[var(--bone)] flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] border-t-2 border-[var(--border-strong)]">
          <div className="flex gap-4">
             <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">ESC</kbd> CLOSE</span>
             <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">TAB</kbd> FOCUS</span>
          </div>
          <div className="opacity-50">JANRAKSHAK COMMAND CORE</div>
        </div>
      </div>
    </div>
  );
};

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { disaster_mode, toggle: toggleDisaster } = useDisaster();
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardPath = getDashboardPathForRole(user?.role);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coords, setCoords] = useState("Locating..."); // #9: don't show Delhi before GPS resolves
  const [time, setTime] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [syncQueue, setSyncQueue] = useState(0);
  const [badges, setBadges] = useState({ requests: 0, missions: 0 });
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const commandMap = useMemo(() => ({
    'show map': () => { navigate('/map'); toast.success("Opening Tactical Map"); },
    'show dashboard': () => { navigate('/dashboard'); },
    'show missions': () => { navigate('/missions'); },
    'disaster mode': () => { if (user?.role === 'admin') toggleDisaster(!disaster_mode, "Tactical Voice Trigger"); },
    'report complete': () => { toast.info("Say 'Mission verified' to confirm action"); }
  }), [navigate, user, disaster_mode, toggleDisaster]);

  const { listening, startListening, stopListening } = useVoiceCommands(commandMap);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateSyncQueue = async () => {
      const queued = await getQueuedRequests();
      setSyncQueue(queued.length);
    };
    updateSyncQueue();
    const sId = setInterval(updateSyncQueue, 5000);

    if (isOnline) {
      const sync = async () => {
        const queued = await getQueuedRequests();
        if (queued.length > 0) {
          const tId = toast.loading(`Syncing ${queued.length} offline operations...`);
          try {
            // #30: parallel sync — one failure no longer blocks all others
            const results = await Promise.allSettled(
              queued.map(req => api({ url: req.url, method: req.method, data: req.body }))
            );
            const ok = results.filter(r => r.status === 'fulfilled').length;
            const fail = results.filter(r => r.status === 'rejected').length;
            if (fail === 0) {
              await clearQueuedRequests();
              setSyncQueue(0);
              toast.success(`Delta-Sync Complete: ${ok} operations synced`, { id: tId });
            } else {
              toast.warning(`${ok} synced, ${fail} failed — will retry`, { id: tId });
            }
          } catch (err) {
            toast.error("Sync failed - will retry later", { id: tId });
          }
        }
      };
      sync();
    }
    return () => clearInterval(sId);
  }, [isOnline]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    }, 1000);

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const fetchBadges = async () => {
      try {
        const canSeeMissions = user?.role === 'admin' || user?.role === 'volunteer';
        const [rRes, mRes] = await Promise.allSettled([
          api.get("/needs?limit=50"), // #8: limit badge fetch — don't download entire collection
          canSeeMissions ? api.get("/missions") : Promise.resolve({ data: [] })
        ]);
        
        const rData = rRes.status === 'fulfilled' ? rRes.value.data : [];
        const mData = mRes.status === 'fulfilled' ? mRes.value.data : [];

        setBadges({ 
          requests: (rData || []).filter(n => n.status === 'pending').length, 
          missions: (mData || []).filter(mis => mis.status !== 'completed').length 
        });
      } catch (err) {
        console.error("Telemetry failure:", err);
      }
    };
    fetchBadges();
    const badgeInterval = setInterval(fetchBadges, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(badgeInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      // #35: 5s timeout + error handler — no more infinite "Locating..."
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords(`${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`);
        },
        () => setCoords("GPS unavailable"),
        { timeout: 5000, maximumAge: 300000 }
      );
    } else {
      setCoords("GPS unsupported");
    }
  }, []);

  const navItems = [
    { name: t("dashboard"), path: dashboardPath, icon: SquaresFour },
    { 
      name: t("needs"), 
      path: "/needs", 
      icon: Warning, 
      badge: badges.requests > 0 ? badges.requests : null,
      badgeColor: "bg-[var(--signal-red)]"
    },
    ...(user?.role === "admin" || user?.role === "volunteer" ? [
      { name: t("map"), path: "/map", icon: MapTrifold, badge: "LIVE", badgeColor: "bg-blue-500" },
      { name: t("volunteers"), path: "/volunteers", icon: Users },
      { name: t("resources"), path: "/resources", icon: Package },
      { 
        name: t("missions"), 
        path: "/missions", 
        icon: ClipboardText,
        badge: badges.missions > 0 ? badges.missions : null,
        badgeColor: "bg-[var(--ink)]"
      }
    ] : []),
    ...(user?.role === "admin" ? [{ name: t("analytics"), path: "/analytics", icon: ChartLine }] : []),
    { name: "Settings", path: "/settings", icon: Gear }
  ];

  return (
    <div className="h-screen flex bg-[var(--bone)] overflow-hidden">
      <SearchModal open={searchOpen} setOpen={setSearchOpen} navItems={navItems} navigate={navigate} />

      {/* Mobile Sidebar - Slide-over */}
      <div className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={28} weight="fill" className="text-[var(--signal-red)]" aria-hidden="true" />
              <h1 className="font-heading text-xl font-black tracking-tighter">{t("app_name")}</h1>
            </div>
            <button 
              onClick={listening ? stopListening : startListening}
              className={`p-2 border-2 ${listening ? "bg-[var(--signal-red)] border-[var(--signal-red)] animate-pulse" : "bg-[var(--bone-alt)] border-[var(--border)]"} shadow-[2px_2px_0px_var(--border)] transition-all`}
              aria-label={t("voice_dispatch")}
            >
              <Microphone size={16} weight={listening ? "fill" : "bold"} className={listening ? "text-white" : "text-[var(--ink)]"} />
            </button>
          </div>
          <nav className="flex-1 py-4 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-6 py-4 border-l-4 transition-all ${active ? "border-[var(--signal-red)] bg-[var(--bone-alt)] text-[var(--ink)] font-bold" : "border-transparent text-[var(--ink-soft)]"}`}
                >
                  <item.icon size={22} weight={active ? "fill" : "bold"} />
                  <span className="text-base">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-6 border-t border-[var(--border)] bg-[var(--bone-alt)]/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--ink)] text-[var(--bone)] flex items-center justify-center font-black">{user?.name?.substring(0, 2).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-sm">{user?.name}</div>
                <div className="text-[10px] uppercase font-black text-[var(--signal-red)]">{user?.role}</div>
              </div>
            </div>
            <button onClick={() => { logout(); navigate("/login"); }} className="btn-hard w-full !text-[10px] py-3 flex items-center justify-center gap-2">
              <SignOut size={16} weight="bold" /> {t("logout")}
            </button>
          </div>
        </aside>
      </div>

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-[var(--border)] transition-all duration-300 ease-in-out relative z-30 ${collapsed ? "w-20" : "w-64"}`}>
        <div className={`p-6 border-b border-[var(--border)] flex items-center justify-between ${collapsed ? "flex-col gap-4" : ""}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <Radio size={28} weight="fill" className="text-[var(--signal-red)] shrink-0" aria-hidden="true" />
            <div className={`transition-opacity duration-200 ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}>
              <h1 className="font-heading text-xl font-black tracking-tighter leading-none">{t("app_name")}</h1>
            </div>
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="p-1 hover:bg-[var(--bone-alt)] rounded transition-colors text-[var(--ink-soft)]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CaretLeft size={16} weight="bold" className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-4 px-6 py-3.5 border-l-[3px] transition-all duration-150 group relative ${active ? "border-[var(--signal-red)] bg-[var(--bone-alt)] text-[var(--ink)] font-bold" : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bone)]"}`}>
                <item.icon size={20} weight={active ? "fill" : "bold"} className="shrink-0" />
                <span className={`text-sm transition-opacity duration-200 ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}>{item.name}</span>
                {item.badge && (
                  <div className={`absolute ${collapsed ? "top-2 right-4" : "right-4"} ${item.badgeColor || "bg-[var(--ink)]"} text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow-sm`}>{item.badge}</div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--border)] bg-[var(--bone-alt)]/30">
          <div className={`p-4 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="relative shrink-0">
              <div className={`w-10 h-10 rounded-full bg-[#2a2928] text-[var(--bone)] flex items-center justify-center font-black text-xs border-2 border-white shadow-sm ring-1 ring-[var(--border)] ${collapsed ? "w-8 h-8 text-[10px]" : ""}`}>
                {user?.name?.substring(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-heading font-bold text-sm truncate">{user?.name}</div>
                  <button 
                    onClick={() => { logout(); navigate("/login"); }}
                    className="p-1 text-[var(--ink-soft)] hover:text-[var(--signal-red)] transition-colors"
                    aria-label={t("logout")}
                  >
                    <SignOut size={16} weight="bold" />
                  </button>
                </div>
                <div className={`inline-block mt-0.5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter rounded-sm ${
                  user?.role === 'admin' ? "bg-[var(--signal-red)] text-white" : "bg-[#2a2928] text-[var(--bone)]"
                }`}>
                  {user?.role}
                </div>
              </div>
            )}
          </div>

          <div className={`border-t border-[var(--border)] px-4 py-2 flex items-center justify-between bg-white/50 ${collapsed ? "flex-col gap-2" : ""}`}>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Translate size={12} weight="bold" className="text-[var(--ink-soft)]" />
              <div className="flex gap-0.5">
                {['en', 'hi'].map((l) => (
                  <button 
                    key={l} 
                    onClick={() => setLang(l)} 
                    className={`px-1.5 py-0.5 text-[9px] font-black transition-all ${
                      lang === l 
                        ? "bg-[#2a2928] text-[var(--bone)]" 
                        : "text-[var(--ink-soft)] hover:text-[#2a2928]"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {!collapsed && <div className="text-[9px] font-bold text-[var(--ink-muted)] tracking-tighter">v2.6.4</div>}
          </div>

          {collapsed && (
            <button 
              onClick={() => { logout(); navigate("/login"); }}
              className="p-3 w-full flex justify-center text-[var(--ink-soft)] hover:text-[var(--signal-red)] border-t border-[var(--border)]"
              aria-label={t("logout")}
            >
              <SignOut size={20} weight="bold" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-[var(--border)] bg-white flex items-center justify-between px-4 md:px-6 z-30">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            <button className="md:hidden p-1 text-[var(--ink-soft)]" onClick={() => setMobileMenuOpen(true)}>
              <List size={22} />
            </button>
            <div 
              className="bg-[var(--bone-alt)] border border-[var(--border)] px-1.5 md:px-3 py-1 flex items-center gap-2 md:gap-4 shrink shadow-sm h-10 md:h-9 overflow-hidden min-w-0"
              aria-label={t("telemetry_feed")}
            >
              <div className="font-mono text-[9px] md:text-[10px] text-[var(--ink)] flex items-center gap-1.5 shrink-0">
                <div className={`w-2 h-2 rounded-full ring-1 ring-white ${isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500"}`} aria-hidden="true" />
                <span className="font-bold tracking-tight uppercase hidden xs:inline">{isOnline ? t("online") : t("offline")}</span>
                {syncQueue > 0 && (
                  <span className="ml-2 flex items-center gap-1 bg-[var(--signal-red)] text-white text-[8px] px-1 animate-pulse">
                    <ChartLine size={10} weight="bold" /> {syncQueue} SYNC
                  </span>
                )}
              </div>
              <div className="w-[1px] h-3 bg-[var(--border)] hidden xs:block" />
              <div className="font-mono text-[9px] md:text-[10px] text-[var(--ink-soft)] flex items-center gap-2 overflow-hidden">
                <span className="tracking-tight hidden lg:inline opacity-70 whitespace-nowrap">{coords}</span>
                <span className="text-[var(--border)] hidden lg:inline">|</span>
                <span className="tabular-nums font-bold tracking-tighter text-[var(--ink)] whitespace-nowrap">{time}</span>
              </div>
            </div>
            {disaster_mode && (
              <div className="flex items-center gap-2 ml-2" role="alert" aria-live="assertive">
                <div className="tc-badge !bg-[var(--signal-red)] !text-white flex items-center gap-1.5 px-2 py-1 border border-[#4a4947] shadow-[2px_2px_0px_#4a4947]">
                  <Siren size={12} weight="fill" className="animate-bounce" aria-hidden="true" />
                  {/* #3: disaster_reason never declared in useDisaster() — was ReferenceError */}
                  <span className="font-black tracking-tight">{t("disaster_mode")}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0 ml-1">
            <button 
              onClick={() => listening ? stopListening() : startListening()}
              className={`p-2 border border-[var(--border)] transition-all ${listening ? "bg-[var(--signal-red)] text-white animate-pulse" : "bg-[var(--bone-alt)] text-[var(--ink)]"}`}
              title={t("voice_dispatch")}
            >
              {listening ? <Microphone weight="fill" size={16} /> : <Microphone size={16} weight="bold" />}
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border border-[var(--border)] bg-[var(--bone-alt)] text-[var(--ink)] hover:bg-[var(--bone)] transition-all"
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
            </button>
            <button 
              onClick={() => setSearchOpen(true)}
              className="p-2 flex items-center gap-2 bg-[#2a2928] text-[var(--bone)] border border-[#4a4947] shadow-[2px_2px_0px_var(--border)]"
            >
              <MagnifyingGlass size={16} weight="bold" />
              <span className="hidden lg:inline text-[9px] font-black uppercase text-white">{t("search")}</span>
            </button>
          </div>
        </header>

        <div id="main-content" className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Nav */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bone)] border-t-2 border-[var(--ink)] flex justify-around items-center h-16 z-50 pb-safe">
          <Link to={dashboardPath} className="flex-1 flex flex-col items-center justify-center text-[var(--ink-soft)] hover:text-[var(--signal-red)]"><SquaresFour size={24} /></Link>
          <Link to="/needs" className="flex-1 flex flex-col items-center justify-center text-[var(--ink-soft)] hover:text-[var(--signal-red)]"><Warning size={24} /></Link>
          {user?.role !== "user" && <Link to="/map" className="flex-1 flex flex-col items-center justify-center text-[var(--ink-soft)] hover:text-[var(--signal-red)]"><MapTrifold size={24} /></Link>}
          <button onClick={() => setMobileMenuOpen(true)} className="flex-1 flex flex-col items-center justify-center text-[var(--ink-soft)]"><List size={24} /></button>
        </nav>
      )}
    </div>
  );
}
