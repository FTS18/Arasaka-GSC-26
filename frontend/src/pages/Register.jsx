import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "volunteer", language: "en" });
  const [loading, setLoading] = useState(false);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created");
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 tc-gridline">
      <div className="w-full max-w-md tc-card">
        <div className="tc-label text-[#BEBFC2]">ONBOARDING · FIELD AGENT</div>
        <h1 className="font-heading text-4xl font-black tracking-tighter mt-3">Create account</h1>

        <form onSubmit={submit} className="mt-6 space-y-6" data-testid="register-form">
          <div><label className="tc-label">Full Name</label><input className="tc-input" value={form.name} onChange={(e)=>upd("name", e.target.value)} required data-testid="reg-name" /></div>
          <div><label className="tc-label">Email</label><input type="email" className="tc-input" value={form.email} onChange={(e)=>upd("email", e.target.value)} required data-testid="reg-email" /></div>
          <div><label className="tc-label">Password</label><input type="password" className="tc-input" value={form.password} onChange={(e)=>upd("password", e.target.value)} required data-testid="reg-password" /></div>
          <div>
            <label className="tc-label">Role</label>
            <select className="tc-select" value={form.role} onChange={(e)=>upd("role", e.target.value)} data-testid="reg-role">
              <option value="user">User</option>
              <option value="volunteer">Volunteer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn-primary w-full" disabled={loading} data-testid="reg-submit">
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </button>
          <div className="text-xs font-mono text-[var(--ink-soft)] text-center">
            Have an account? <Link to="/login" className="underline">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
