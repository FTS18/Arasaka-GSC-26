import React, { useState, useEffect } from "react";
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
  
  const filtered = navItems.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 backdrop-blur-sm bg-black/20">
      <div 
        className="fixed inset-0" 
        onClick={() => setOpen(false)} 
      />
      <div className="relative w-full max-w-2xl bg-white border-2 border-[var(--ink)] shadow-[8px_8px_0px_var(--ink)] overflow-hidden flex flex-col">
        <div className="p-4 border-b-2 border-[var(--border)] flex items-center gap-3">
          <MagnifyingGlass size={24} weight="bold" className="text-[var(--ink-muted)]" />
          <input
            autoFocus
            placeholder="Type to navigate... (Esc to close)"
            className="flex-1 bg-transparent border-none outline-none font-heading text-xl font-bold"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter' && filtered.length > 0) {
                navigate(filtered[0].path);
                setOpen(false);
              }
            }}
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setOpen(false); }}
                className="w-full flex items-center justify-between p-3 hover:bg-[var(--bone-alt)] transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} weight="bold" className="text-[var(--ink-soft)] group-hover:text-[var(--signal-red)]" />
                  <span className="font-bold">{item.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--ink-muted)] uppercase tracking-widest">{item.path}</span>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-[var(--ink-muted)] font-mono text-xs uppercase">No results found</div>
          )}
        </div>
        <div className="p-3 bg-[var(--bone)] border-t border-[var(--border)] flex justify-between items-center text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-widest">
          <span>Arrows to navigate</span>
          <span>Enter to select</span>
        </div>
      </div>
    </div>
  );
};

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { disaster_mode, disaster_reason } = useDisaster();
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardPath = getDashboardPathForRole(user?.role);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coords, setCoords] = useState("28.61°N, 77.20°E");
  const [time, setTime] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [badges, setBadges] = useState({ requests: 0, missions: 0 });
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const voiceCommands = {
    "go to dashboard": () => navigate(dashboardPath),
    "go to requests": () => navigate("/needs"),
    "go to map": () => navigate("/map"),
    "go to missions": () => navigate("/missions"),
    "sign out": () => { logout(); navigate("/login"); },
    "emergency": () => { if(user?.role === 'admin') navigate("/admin-dashboard"); },
    "data refresh": () => window.location.reload()
  };

  const { listening, startListening, stopListening } = useVoiceCommands(voiceCommands);
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
    if (isOnline) {
      const sync = async () => {
        const queued = await getQueuedRequests();
        if (queued.length > 0) {
          const tId = toast.loading(`Syncing ${queued.length} offline operations...`);
          try {
            for (const req of queued) {
              await api({
                url: req.url,
                method: req.method,
                data: req.body
              });
            }
            await clearQueuedRequests();
            toast.success("Delta-Sync Complete", { id: tId });
          } catch (err) {
            toast.error("Sync failed - will retry later", { id: tId });
          }
        }
      };
      sync();
    }
  }, [isOnline]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toISOString().split('T')[1].split('.')[0] + " Z");
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
          api.get("/needs"),
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
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords(`${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`);
      });
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
              <Radio size={28} weight="fill" className="text-[var(--signal-red)]" />
              <h1 className="font-heading text-xl font-black tracking-tighter">JANRAKSHAK</h1>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[var(--ink-soft)]"><CloseIcon size={20} weight="bold" /></button>
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
              <SignOut size={16} weight="bold" /> Log Out
            </button>
          </div>
        </aside>
      </div>

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-[var(--border)] transition-all duration-300 ease-in-out relative z-30 ${collapsed ? "w-20" : "w-64"}`}>
        <div className={`p-6 border-b border-[var(--border)] flex items-center justify-between ${collapsed ? "flex-col gap-4" : ""}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <Radio size={28} weight="fill" className="text-[var(--signal-red)] shrink-0" />
            <div className={`transition-opacity duration-200 ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}>
              <h1 className="font-heading text-xl font-black tracking-tighter leading-none">JANRAKSHAK</h1>
            </div>
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-[var(--bone-alt)] rounded transition-colors text-[var(--ink-soft)]">
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
              <div className={`w-10 h-10 rounded-full bg-[var(--ink)] text-[var(--bone)] flex items-center justify-center font-black text-xs border-2 border-white shadow-sm ring-1 ring-[var(--border)] ${collapsed ? "w-8 h-8 text-[10px]" : ""}`}>
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
                  >
                    <SignOut size={16} weight="bold" />
                  </button>
                </div>
                <div className={`inline-block mt-0.5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter rounded-sm ${
                  user?.role === 'admin' ? "bg-[var(--signal-red)] text-white" : "bg-[var(--ink)] text-[var(--bone)]"
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
                        ? "bg-[var(--ink)] text-white" 
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {!collapsed && <div className="text-[9px] font-bold text-[var(--ink-muted)] tracking-tighter">VERSION 2.6.4</div>}
          </div>

          {collapsed && (
            <button 
              onClick={() => { logout(); navigate("/login"); }}
              className="p-3 w-full flex justify-center text-[var(--ink-soft)] hover:text-[var(--signal-red)] border-t border-[var(--border)]"
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
            <div className="bg-[var(--bone-alt)] border border-[var(--border)] px-3 py-1 flex items-center gap-3 md:gap-4 shrink-0 shadow-sm h-10 md:h-9">
              <div className="font-mono text-[10px] text-[var(--ink)] flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ring-2 ring-white ${isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500"}`} />
                <span className="font-bold tracking-tight uppercase">{isOnline ? "Online" : "Offline"}</span>
              </div>
              <div className="w-[1px] h-4 bg-[var(--border)]" />
              <div className="font-mono text-[10px] text-[var(--ink-soft)] flex items-center gap-3 overflow-hidden">
                <span className="tracking-tight hidden sm:inline opacity-70">{coords}</span>
                <span className="text-[var(--border)] hidden sm:inline">|</span>
                <span className="tabular-nums font-bold tracking-tighter text-[var(--ink)]">{time}</span>
              </div>
            </div>
            {disaster_mode && (
              <div className="flex items-center gap-2 ml-2">
                <div className="tc-badge !bg-[var(--signal-red)] !text-white flex items-center gap-1.5 px-2 py-1 border border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)]">
                  <Siren size={12} weight="fill" className="animate-bounce" />
                  <span className="font-black tracking-tight">{disaster_reason || "EMERGENCY"}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => listening ? stopListening() : startListening()}
              className={`p-2 border border-[var(--border)] transition-all ${listening ? "bg-[var(--signal-red)] text-white animate-pulse" : "bg-[var(--bone-alt)] text-[var(--ink)]"}`}
              title="Voice Dispatch"
            >
              {listening ? <Microphone weight="fill" size={18} /> : <Microphone size={18} weight="bold" />}
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border border-[var(--border)] bg-[var(--bone-alt)] text-[var(--ink)] hover:bg-[var(--bone)] transition-all"
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
            </button>
            <button 
              onClick={() => setSearchOpen(true)}
              className="btn-ghost !p-2 flex items-center gap-2 border-[var(--border)]"
            >
              <MagnifyingGlass size={18} weight="bold" />
              <span className="hidden lg:inline text-[10px] font-bold opacity-50">CTRL + K</span>
            </button>
          </div>
        </header>

        <div id="main-content" className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Nav */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[var(--ink)] flex justify-around items-center h-16 z-50 pb-safe">
          <Link to={dashboardPath} className="flex-1 flex flex-col items-center justify-center text-[var(--ink-soft)] hover:text-[var(--signal-red)]"><SquaresFour size={24} /></Link>
          <Link to="/needs" className="flex-1 flex flex-col items-center justify-center text-[var(--ink-soft)] hover:text-[var(--signal-red)]"><Warning size={24} /></Link>
          <Link to="/map" className="flex-1 flex flex-col items-center justify-center text-[var(--ink-soft)] hover:text-[var(--signal-red)]"><MapTrifold size={24} /></Link>
          <button onClick={() => setMobileMenuOpen(true)} className="flex-1 flex flex-col items-center justify-center text-[var(--ink-soft)]"><List size={24} /></button>
        </nav>
      )}
    </div>
  );
}
