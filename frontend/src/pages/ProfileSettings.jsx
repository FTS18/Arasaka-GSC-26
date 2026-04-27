import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // #23
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getDashboardPathForRole } from "@/lib/roleRoutes"; // #23
import { User, IdentificationBadge, Translate, Phone, Briefcase, MapPin, CheckCircle } from "@phosphor-icons/react";

export default function ProfileSettings() {
  const { user, refresh } = useAuth(); // #23: need refresh to re-init auth context
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    language: "en",
    volunteer_data: {
      availability: "available",
      base_location: { lat: 0, lng: 0 },
      skills: []
    }
  });

  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me/profile");
        const data = res.data;
        setProfile(data);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          language: data.language || "en",
          volunteer_data: {
            availability: data.volunteer_data?.availability || "available",
            base_location: data.volunteer_data?.base_location || { lat: 0, lng: 0 }, // #34: no Delhi default
            skills: data.volunteer_data?.skills || []
          }
        });
      } catch (e) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/me/profile", formData);
      toast.success("Profile fully updated.");
    } catch (e) {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setFormData(prev => ({
      ...prev,
      volunteer_data: {
        ...prev.volunteer_data,
        skills: [...prev.volunteer_data.skills, newSkill.trim()]
      }
    }));
    setNewSkill("");
  };

  const removeSkill = (sk) => {
    setFormData(prev => ({
      ...prev,
      volunteer_data: {
        ...prev.volunteer_data,
        skills: prev.volunteer_data.skills.filter(s => s !== sk)
      }
    }));
  };

  const handleCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            volunteer_data: {
              ...prev.volunteer_data,
              base_location: { lat: position.coords.latitude, lng: position.coords.longitude }
            }
          }));
          toast.success("Base location updated.");
        },
        () => toast.error("Location access denied or failed.")
      );
    }
  };

  if (loading) return <div className="p-8 font-mono text-xl animate-pulse">LOADING PROFILE DATA...</div>;

  const handleToggleRole = async () => {
    if (!window.confirm(`Switch to ${user.role === "user" ? "Volunteer" : "Resident"} role?`)) return;
    setToggling(true);
    try {
      const res = await api.post("/auth/toggle-role");
      localStorage.setItem("janrakshak_token", res.data.token);
      toast.success(res.data.message);
      // #23: use auth refresh + navigate instead of full page reload
      await refresh();
      navigate(getDashboardPathForRole(res.data.role || user.role));
    } catch (e) {
      toast.error("Role switch failed.");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="border-4 border-[var(--ink)] bg-[var(--bone)] p-6 shadow-brutal tc-card">
        <div className="mb-8">
          <div className="tc-label">Global Identity</div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-4xl font-black tracking-tighter mt-1">Profile & Settings</h1>
              <p className="font-mono text-xs opacity-80 mt-2">Operator Class: <span className="uppercase font-bold tc-badge tc-badge-outl">{user?.role}</span></p>
            </div>
            {user?.role !== "admin" && (
              <button 
                type="button" 
                onClick={handleToggleRole}
                disabled={toggling}
                className="tc-btn px-4 py-2 bg-[var(--ink)] text-white text-xs font-bold uppercase hover:bg-[var(--signal-red)] transition-all"
              >
                {toggling ? "PROCESSING..." : `SWITCH TO ${user?.role === "user" ? "VOLUNTEER" : "RESIDENT"}`}
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Universal Settings */}
          <div className="border-2 border-[var(--ink)] p-4 bg-white relative">
            <h2 className="absolute -top-3 left-4 bg-[var(--bone)] border-2 border-[var(--ink)] px-2 font-mono font-bold text-xs uppercase">
              Operator Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-1 flex items-center gap-2"><User size={14}/> Display Name</label>
                <input 
                  type="text" 
                  className="tc-input w-full bg-gray-50"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-1 flex items-center gap-2"><Phone size={14}/> Phone Number</label>
                <input 
                  type="tel" 
                  className="tc-input w-full bg-gray-50"
                  placeholder="+91..."
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-1 flex items-center gap-2"><Translate size={14}/> Interface Language</label>
                <select 
                  className="tc-input w-full bg-gray-50"
                  value={formData.language}
                  onChange={e => setFormData(prev => ({...prev, language: e.target.value}))}
                >
                  <option value="en">English (US)</option>
                  {/* #13: removed Español — i18n only supports en/hi, selecting es broke entire UI */}
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Responder Specific */}
          {user?.role === "volunteer" && (
            <div className="border-2 border-[var(--signal-red)] p-4 bg-red-50 relative mt-8">
              <h2 className="absolute -top-3 left-4 bg-[var(--signal-red)] text-white border-2 border-[var(--ink)] px-2 font-mono font-bold text-xs uppercase">
                Field Responder Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-1 flex items-center gap-2"><CheckCircle size={14} className="text-red-500" /> Duty Status</label>
                  <select 
                    className="tc-input w-full bg-white border-red-300 focus:border-[var(--signal-red)]"
                    value={formData.volunteer_data.availability}
                    onChange={e => setFormData(prev => ({
                      ...prev, 
                      volunteer_data: {...prev.volunteer_data, availability: e.target.value}
                    }))}
                  >
                    <option value="available">Available / On-Duty</option>
                    <option value="assigned">Currently Assigned</option>
                    <option value="off_duty">Off-Duty / Unavailable</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-1 flex items-center gap-2"><MapPin size={14} className="text-red-500"/> Deployment Base</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="tc-input flex-1 bg-white font-mono text-xs"
                      readOnly
                      value={`${formData.volunteer_data.base_location.lat.toFixed(4)}, ${formData.volunteer_data.base_location.lng.toFixed(4)}`}
                    />
                    <button type="button" onClick={handleCurrentLocation} className="tc-btn px-4 bg-[var(--ink)] text-white text-xs">
                      USE GPS
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-mono text-xs font-bold uppercase mb-1 flex items-center gap-2"><Briefcase size={14} className="text-red-500"/> Operational Skills</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      className="tc-input flex-1 bg-white border-red-300"
                      placeholder="e.g. EMT, Heavy Machinery, HAM Radio..."
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <button type="button" onClick={addSkill} className="tc-btn px-6 text-sm bg-red-100 hover:bg-red-200">
                      ADD
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.volunteer_data.skills.map((sk, idx) => (
                      <span key={idx} className="bg-[var(--ink)] text-white px-3 py-1 font-mono text-xs flex items-center gap-2 font-bold uppercase">
                        {sk}
                        <button type="button" onClick={() => removeSkill(sk)} className="hover:text-red-400">
                          &times;
                        </button>
                      </span>
                    ))}
                    {formData.volunteer_data.skills.length === 0 && (
                      <span className="text-xs font-mono opacity-50 uppercase">No skills registered.</span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={saving}
              className="tc-btn px-8 py-3 bg-[var(--signal-red)] text-white font-bold text-lg disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? "SAVING..." : "COMMIT CHANGES"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
