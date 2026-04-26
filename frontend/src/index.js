import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister();
        console.log('Force un-registered trapped SW:', registration);
      }
    });

    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW Registered Freshly:', reg))
      .catch(err => console.log('SW Registration Failed:', err));
  });
}
