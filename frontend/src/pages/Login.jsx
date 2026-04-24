import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@humops.org");
  const [password, setPassword] = useState("Admin@12345");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Authenticated");
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex tc-gridline">
      <div className="hidden md:flex w-1/2 bg-[var(--ink)] text-[var(--bone)] p-12 flex-col justify-between">
        <div>
          <div className="overline text-[#BEBFC2]">EST. 2026 · FIELD CONSOLE</div>
          <div className="font-heading text-4xl font-black tracking-tighter mt-4 leading-[0.95]">
            HUMANITARIAN<br />OPERATIONS<br /><span className="text-[var(--signal-red)]">COMMAND.</span>
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
              <div className="overline text-[#BEBFC2] mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="overline">Access Console</div>
          <h1 className="font-heading text-3xl font-black tracking-tighter mt-1">Sign in</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2">Operator credentials required.</p>

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
            Demo: admin@humops.org / Admin@12345
          </div>
        </div>
      </div>
    </div>
  );
}
