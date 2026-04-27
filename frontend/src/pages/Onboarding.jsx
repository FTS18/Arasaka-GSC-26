import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { User, IdentificationCard, ShieldCheck, MapPin, Phone, Truck, Wrench } from "@phosphor-icons/react";

export default function OnboardingPage() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1); // 1: Role, 2: Details
  const [role, setRole] = useState("user");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [skills, setSkills] = useState("");
  const [transport, setTransport] = useState("none");
  const [loading, setLoading] = useState(false);

  // Redirect if already onboarded (safety)
  React.useEffect(() => {
    if (user?.onboarded) {
      nav("/dashboard");
    }
  }, [user, nav]);

  if (user?.onboarded) return null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/onboard", {
        role,
        phone,
        city,
        skills: skills.split(",").map(s => s.trim()).filter(s => s),
        transport,
        emergency_contact: ""
      });
      toast.success("Profile Activated");
      await refresh();
      nav(role === "admin" ? "/admin" : (role === "volunteer" ? "/volunteer" : "/dashboard"));
    } catch (err) {
      toast.error("Onboarding failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bone)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[var(--bone)] border-2 border-[var(--ink)] shadow-[8px_8px_0px_0px_var(--ink)] p-8">
        <div className="tc-label mb-2">Janrakshak Onboarding</div>
        <h1 className="font-heading text-4xl font-black tracking-tighter leading-none mb-6">
          Set up your <span className="text-[var(--signal-red)]">profile.</span>
        </h1>

        {step === 1 ? (
          <div className="space-y-6">
            <p className="text-sm font-mono text-[var(--ink-soft)]">Choose your tactical role</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => { setRole("volunteer"); setStep(2); }}
                className="flex flex-col items-center p-6 border-2 border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bone)] transition-all group"
              >
                <Truck size={48} weight="fill" className="mb-4 group-hover:scale-110 transition-transform" />
                <span className="font-heading text-xl font-bold">Volunteer</span>
                <span className="text-center text-xs mt-2 opacity-70">Deploy to locations, deliver aid, and save lives.</span>
              </button>
              <button 
                onClick={() => { setRole("user"); setStep(2); }}
                className="flex flex-col items-center p-6 border-2 border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bone)] transition-all group"
              >
                <User size={48} weight="fill" className="mb-4 group-hover:scale-110 transition-transform" />
                <span className="font-heading text-xl font-bold">Resident</span>
                <span className="text-center text-xs mt-2 opacity-70">Report needs, track alerts, and access resources.</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <button type="button" onClick={() => setStep(1)} className="text-xs underline font-mono">← Change Role</button>
              <div className="tc-badge bg-[var(--ink)] text-[var(--bone)]">{role}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="tc-label flex items-center gap-1"><Phone size={14} /> Phone Number</label>
                <input 
                  required 
                  className="tc-input" 
                  placeholder="+91 XXXXX XXXXX" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="tc-label flex items-center gap-1"><MapPin size={14} /> Base City</label>
                <input 
                  required 
                  className="tc-input" 
                  placeholder="e.g. Mumbai" 
                  value={city} 
                  onChange={e => setCity(e.target.value)}
                />
              </div>

              {role === "volunteer" && (
                <>
                  <div>
                    <label className="tc-label flex items-center gap-1"><Wrench size={14} /> Skills (Comma separated)</label>
                    <input 
                      className="tc-input" 
                      placeholder="First Aid, Driving, Navigation" 
                      value={skills} 
                      onChange={e => setSkills(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="tc-label flex items-center gap-1"><Truck size={14} /> Transport Available</label>
                    <select 
                      className="tc-input" 
                      value={transport} 
                      onChange={e => setTransport(e.target.value)}
                    >
                      <option value="none">None (Foot)</option>
                      <option value="bike">Two-Wheeler</option>
                      <option value="car">Car / Van</option>
                      <option value="truck">Heavy Vehicle</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              <ShieldCheck size={20} />
              {loading ? "Committing Profile..." : "Complete Onboarding"}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[var(--border)] text-[10px] font-mono text-[var(--ink-muted)] text-center tracking-widest">
          JANRAKSHAK · FIELD OPS SYSTEM · SECURE ONBOARDING
        </div>
      </div>
    </div>
  );
}
