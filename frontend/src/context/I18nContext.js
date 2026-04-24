import React, { createContext, useContext, useState } from "react";

const dict = {
  en: {
    app_name: "HUMOPS",
    tagline: "Humanitarian Operations Command Center",
    dashboard: "Dashboard",
    needs: "Requests",
    volunteers: "Volunteers",
    resources: "Resources",
    map: "Live Map",
    analytics: "Analytics",
    citizen: "Citizen Report",
    missions: "Missions",
    logout: "Log out",
    login: "Log in",
    register: "Register",
    critical_needs: "Critical Requests",
    active_needs: "Active Requests",
    resolved: "Resolved",
    volunteers_available: "Volunteers Available",
    disaster_mode: "Disaster Mode",
    new_request: "New Request",
    submit: "Submit",
    priority: "Priority",
    urgency: "Urgency",
    category: "Category",
    location: "Location",
    affected: "People Affected",
  },
  hi: {
    app_name: "HUMOPS",
    tagline: "मानवतावादी संचालन कमांड सेंटर",
    dashboard: "डैशबोर्ड",
    needs: "अनुरोध",
    volunteers: "स्वयंसेवक",
    resources: "संसाधन",
    map: "लाइव मानचित्र",
    analytics: "विश्लेषण",
    citizen: "नागरिक रिपोर्ट",
    missions: "मिशन",
    logout: "लॉगआउट",
    login: "लॉगिन",
    register: "पंजीकरण",
    critical_needs: "गंभीर अनुरोध",
    active_needs: "सक्रिय अनुरोध",
    resolved: "हल किए गए",
    volunteers_available: "उपलब्ध स्वयंसेवक",
    disaster_mode: "आपदा मोड",
    new_request: "नया अनुरोध",
    submit: "सबमिट करें",
    priority: "प्राथमिकता",
    urgency: "तात्कालिकता",
    category: "श्रेणी",
    location: "स्थान",
    affected: "प्रभावित लोग",
  },
};

const I18nCtx = createContext(null);
export const useI18n = () => useContext(I18nCtx);

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem("humops_lang") || "en");
  const t = (k) => dict[lang]?.[k] || dict.en[k] || k;
  const change = (l) => { setLang(l); localStorage.setItem("humops_lang", l); };
  return <I18nCtx.Provider value={{ lang, setLang: change, t }}>{children}</I18nCtx.Provider>;
};
