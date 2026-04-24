import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useDisaster } from "@/context/DisasterContext";
import {
  SquaresFour, Warning, Users, Package, MapTrifold, ChartLine,
  ClipboardText, SignOut, Translate, Siren, Radio,
} from "@phosphor-icons/react";

const NavItem = ({ to, icon: Icon, label, testid }) => {
  const loc = useLocation();
  const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      data-testid={testid}
      className={`flex items-center gap-3 px-4 py-3 border-l-2 transition-all duration-150 ${
        active
          ? "border-[var(--signal-red)] bg-white text-[var(--ink)] font-semibold"
          : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-white"
      }`}
    >
      <Icon size={18} weight={active ? "fill" : "regular"} />
      <span className="font-mono text-xs uppercase tracking-[0.12em]">{label}</span>
    </Link>
  );
};

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { disaster_mode, disaster_reason, toggle } = useDisaster();
  const navigate = useNavigate();

  const canOperate = user && ["admin", "field_worker"].includes(user.role);

  return (
    <div className="min-h-screen flex bg-[var(--bone)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[var(--border)] bg-[var(--bone-alt)] flex flex-col" data-testid="app-sidebar">
        <div className="px-5 py-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Radio size={22} weight="fill" className="text-[var(--signal-red)]" />
            <span className="font-heading text-xl font-black tracking-tighter">HUMOPS</span>
          </div>
          <div className="overline mt-1">{t("tagline")}</div>
        </div>

        <nav className="flex-1 py-3 space-y-1">
          <NavItem to="/dashboard" icon={SquaresFour} label={t("dashboard")} testid="nav-dashboard" />
          <NavItem to="/needs"     icon={Warning}     label={t("needs")} testid="nav-needs" />
          <NavItem to="/map"       icon={MapTrifold}  label={t("map")} testid="nav-map" />
          <NavItem to="/volunteers" icon={Users}      label={t("volunteers")} testid="nav-volunteers" />
          <NavItem to="/resources" icon={Package}     label={t("resources")} testid="nav-resources" />
          <NavItem to="/missions"  icon={ClipboardText} label={t("missions")} testid="nav-missions" />
          <NavItem to="/analytics" icon={ChartLine}   label={t("analytics")} testid="nav-analytics" />
        </nav>

        <div className="p-4 border-t border-[var(--border)] space-y-3">
          <div className="flex items-center gap-2">
            <Translate size={14} className="text-[var(--ink-soft)]" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="tc-select py-1 text-xs font-mono"
              data-testid="lang-switch"
            >
              <option value="en">EN</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
          {user && (
            <div className="space-y-2">
              <div className="overline">Signed in</div>
              <div className="font-semibold text-sm" data-testid="current-user-name">{user.name}</div>
              <div className="tc-badge tc-badge-outl" data-testid="current-user-role">{user.role}</div>
              <button className="btn-ghost w-full flex items-center justify-center gap-2" onClick={() => { logout(); navigate("/login"); }} data-testid="logout-btn">
                <SignOut size={14} /> {t("logout")}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-[var(--border)] bg-[var(--bone)] flex items-center justify-between px-6" data-testid="app-topbar">
          <div className="flex items-center gap-3">
            <div className="overline">Status</div>
            <div className="tc-badge tc-badge-res font-mono" data-testid="ops-status">ONLINE</div>
            {disaster_mode && (
              <div className="flex items-center gap-2 ml-4" data-testid="disaster-banner">
                <Siren size={14} weight="fill" className="text-[var(--signal-red)]" />
                <span className="tc-badge tc-badge-crit">DISASTER MODE</span>
                {disaster_reason && <span className="text-xs font-mono text-[var(--ink-soft)]">{disaster_reason}</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {canOperate && (
              <button
                onClick={() => {
                  const enable = !disaster_mode;
                  const reason = enable ? prompt("Disaster reason (e.g., Flood, Earthquake):") : null;
                  toggle(enable, reason);
                }}
                className={disaster_mode ? "btn-primary" : "btn-ghost"}
                data-testid="toggle-disaster-btn"
              >
                {disaster_mode ? "End Disaster Mode" : "Activate Disaster Mode"}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
