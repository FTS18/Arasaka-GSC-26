import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getDashboardPathForRole } from "@/lib/roleRoutes";
import { api } from "@/lib/api";

const DEFAULT_TEST_CREDS = [
  { role: "admin", label: "Admin", email: "admin@janrakshakops.com", password: "Admin@12345" },
  { role: "user", label: "User", email: "user@janrakshakops.com", password: "User@12345" },
  { role: "volunteer", label: "Volunteer", email: "volunteer@janrakshakops.com", password: "Volunteer@12345" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@janrakshakops.com");
  const [password, setPassword] = useState("Admin@12345");
  const [loading, setLoading] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [testCreds, setTestCreds] = useState(DEFAULT_TEST_CREDS);

  const seedAndOpenCreds = async () => {
    setShowCreds(true);
    setSeeding(true);
    try {
      const response = await api.post("/seed/demo");
      const credentials = Array.isArray(response?.data?.credentials) ? response.data.credentials : [];
      if (credentials.length > 0) {
        setTestCreds(credentials.map((c) => ({
          role: c.role,
          label: c.role?.charAt(0).toUpperCase() + c.role?.slice(1),
          email: c.email,
          password: c.password,
        })));
      }
      toast.success("Test accounts are ready in DB");
    } catch {
      toast.error("Could not seed accounts. Showing default test credentials.");
      setTestCreds(DEFAULT_TEST_CREDS);
    } finally {
      setSeeding(false);
    }
  };

  const useCredential = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setShowCreds(false);
    toast.success(`${cred.label} credentials entered`);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      toast.success("Authenticated");
      nav(getDashboardPathForRole(loggedInUser?.role));
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex tc-gridline">
      <div className="hidden md:flex w-1/2 bg-[var(--ink)] text-[var(--bone)] p-12 flex-col justify-between">
        <div>
          <div className="tc-overline text-[#BEBFC2]">EST. 2026 · FIELD CONSOLE</div>
          <div className="font-heading text-4xl font-black tracking-tighter mt-4 leading-[0.95]">
            JANRAKSHAK<br />GSC-26<br /><span className="text-[var(--signal-red)]">COMMAND.</span>
          </div>
          <p className="mt-6 text-sm text-[#BEBFC2] max-w-md">
            Real-time need triage, volunteer dispatch, resource routing, and impact telemetry — built for NGOs and field teams operating under pressure.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 font-mono">
          {[
            ["48H", "AVG RESPONSE"],
            ["AI", "PRIORITY ENGINE"],
            ["6", "ACCESS ROLES"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-bold">{v}</div>
              <div className="tc-overline text-[#BEBFC2] mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="tc-overline">Access Console</div>
          <h1 className="font-heading text-3xl font-black tracking-tighter mt-1">Sign in</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2">Operator credentials required.</p>
          <button type="button" className="btn-ghost mt-4" onClick={seedAndOpenCreds} data-testid="open-test-creds-btn">
            {seeding ? "PREPARING TEST CREDENTIALS..." : "Show Test Credentials"}
          </button>

          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="login-form">
            <div>
              <label className="tc-label">Email</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="tc-input" data-testid="login-email" required />
            </div>
            <div>
              <label className="tc-label">Password</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="tc-input" data-testid="login-password" required />
            </div>
            <button className="btn-primary w-full" disabled={loading} data-testid="login-submit">
              {loading ? "AUTHENTICATING..." : "ENTER CONSOLE"}
            </button>
          </form>

          <div className="mt-6 text-xs font-mono text-[var(--ink-soft)]">
            No account? <Link to="/register" className="text-[var(--ink)] underline" data-testid="link-register">Register</Link>
            {" · "}
            <Link to="/citizen" className="text-[var(--ink)] underline" data-testid="link-citizen">File citizen report</Link>
          </div>
          <div className="mt-8 border-t border-[var(--border)] pt-4 text-[10px] font-mono text-[var(--ink-muted)]">
            Demo: admin@janrakshakops.com / Admin@12345
          </div>
        </div>
      </div>

      {showCreds && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreds(false)}>
          <div className="tc-card w-full max-w-xl" onClick={(e) => e.stopPropagation()} data-testid="test-creds-modal">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="tc-overline">Quick Login</div>
                <h2 className="font-heading text-2xl font-black tracking-tighter mt-1">Test Credentials by Role</h2>
                <p className="text-sm text-[var(--ink-soft)] mt-2">
                  Click any role to auto-fill the login form.
                </p>
              </div>
              <button className="btn-ghost" type="button" onClick={() => setShowCreds(false)}>Close</button>
            </div>

            <div className="mt-5 grid md:grid-cols-3 gap-3">
              {testCreds.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  className="border border-[var(--border)] p-4 text-left hover:bg-[var(--bone-alt)] transition-colors"
                  onClick={() => useCredential(cred)}
                  data-testid={`test-cred-${cred.role}`}
                >
                  <div className="tc-badge tc-badge-outl">{cred.label}</div>
                  <div className="font-mono text-xs mt-3 break-all">{cred.email}</div>
                  <div className="font-mono text-xs text-[var(--ink-soft)] mt-1">{cred.password}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 text-xs font-mono text-[var(--ink-muted)]">
              {seeding ? "Seeding in progress..." : "Accounts are seeded via /api/seed/demo."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
