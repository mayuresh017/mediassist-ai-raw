// frontend/src/App.jsx — With Leaflet + LRM Nearby Finder + Dark/Light Mode Toggle
import { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
} from "firebase/auth";

// ── Firebase ──────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBZnq_m-UIZvpxs2zIwm4RepBPaENszWbE",
  authDomain: "mediassist-ai-6c0ed.firebaseapp.com",
  projectId: "mediassist-ai-6c0ed",
  storageBucket: "mediassist-ai-6c0ed.firebasestorage.app",
  messagingSenderId: "324836123622",
  appId: "1:324836123622:web:b4c798af10794e4e7d6c27",
  measurementId: "G-QW04WRJ70L",
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// ── Inject Google Fonts ───────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap";
document.head.appendChild(fontLink);

// ── Inject Leaflet CSS + LRM CSS ──────────────────────────────────────────────
["https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
 "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css"
].forEach(href => {
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
});

// ── Global styles ─────────────────────────────────────────────────────────────
const globalStyle = document.createElement("style");
globalStyle.textContent = `
  :root {
    --bg-primary: #020617;
    --bg-secondary: #030712;
    --bg-card: rgba(11,18,32,0.75);
    --bg-card-solid: #0b1220;
    --bg-nav: rgba(2,6,23,0.80);
    --bg-sidebar: rgba(11,18,32,0.72);
    --bg-input: rgba(11,18,32,0.90);
    --bg-chat: rgba(11,18,32,0.68);
    --bg-map-panel: rgba(2,6,23,0.80);
    --border-subtle: rgba(139,92,246,0.14);
    --border-medium: rgba(139,92,246,0.20);
    --text-primary: #e2e8f0;
    --text-secondary: #94a3b8;
    --text-hint: #64748b;
    --text-darker: #f1f5f9;
    --grid-line: rgba(139,92,246,0.02);
    --glow-orb: rgba(139,92,246,0.06);
    --scrollbar-thumb: rgba(139,92,246,0.30);
    --chat-empty-text: #475569;
  }

  [data-theme="light"] {
    --bg-primary: #f1f5f9;
    --bg-secondary: #e2e8f0;
    --bg-card: rgba(255,255,255,0.90);
    --bg-card-solid: #ffffff;
    --bg-nav: rgba(248,250,252,0.95);
    --bg-sidebar: rgba(255,255,255,0.85);
    --bg-input: rgba(255,255,255,0.95);
    --bg-chat: rgba(255,255,255,0.80);
    --bg-map-panel: rgba(248,250,252,0.95);
    --border-subtle: rgba(139,92,246,0.20);
    --border-medium: rgba(139,92,246,0.30);
    --text-primary: #1e293b;
    --text-secondary: #475569;
    --text-hint: #64748b;
    --text-darker: #0f172a;
    --grid-line: rgba(139,92,246,0.04);
    --glow-orb: rgba(139,92,246,0.08);
    --scrollbar-thumb: rgba(139,92,246,0.25);
    --chat-empty-text: #94a3b8;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg-secondary); transition: background 0.3s ease; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 4px; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideInRight { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulseGreen { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0.50)} 70%{box-shadow:0 0 0 10px rgba(59,130,246,0)} }

  .auth-card { animation: fadeUp 0.5s ease both; }
  .msg-user  { animation: slideInRight 0.3s ease both; }
  .msg-bot   { animation: slideIn 0.3s ease both; }

  .field-input:focus { border-color:rgba(139,92,246,0.60)!important; box-shadow:0 0 0 3px rgba(139,92,246,0.12)!important; outline:none; }
  .field-input::placeholder { color:#374151; }
  [data-theme="light"] .field-input::placeholder { color:#94a3b8; }
  .primary-btn { transition:transform 0.15s ease,box-shadow 0.15s ease!important; }
  .primary-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 30px rgba(139,92,246,0.55), 0 0 24px rgba(236,72,153,0.18)!important; }
  .action-btn { transition:all 0.15s ease!important; }
  .action-btn:hover { transform:translateY(-2px); filter:brightness(1.08); box-shadow:0 10px 24px rgba(15,23,42,0.32)!important; }
  .tab-btn { transition:all 0.2s ease!important; }
  .chat-input:focus { outline:none; }
  .send-btn { transition:all 0.15s ease!important; }
  .send-btn:hover:not(:disabled) { background:#7c3aed!important; transform:translateY(-2px); box-shadow:0 10px 24px rgba(139,92,246,0.35)!important; }
  .mic-btn { transition:all 0.15s ease!important; }
  .mic-btn:hover { background:rgba(139,92,246,0.15)!important; transform:translateY(-1px) scale(1.05); box-shadow:0 8px 20px rgba(139,92,246,0.18)!important; }
  .logout-btn { transition:all 0.15s ease!important; }
  .logout-btn:hover { background:#dc2626!important; }
  .section-input:focus { border-color:rgba(139,92,246,0.40)!important; box-shadow:0 0 0 2px rgba(139,92,246,0.08)!important; outline:none; }
  .section-input::placeholder { color:#4b5563; }
  [data-theme="light"] .section-input::placeholder { color:#94a3b8; }
  .nav-pill { transition:all 0.2s ease!important; }
  .nav-pill:hover { border-color:rgba(139,92,246,0.35)!important; color:#e2e8f0!important; box-shadow:0 8px 20px rgba(139,92,246,0.12)!important; }
  .theme-toggle-btn { transition:all 0.2s ease!important; }
  .theme-toggle-btn:hover { background:rgba(139,92,246,0.18)!important; transform:translateY(-1px) scale(1.05); box-shadow:0 8px 20px rgba(139,92,246,0.20)!important; }

  /* Leaflet overrides — adapts to theme */
  .leaflet-container { background:#0a1628 !important; font-family:'DM Sans',sans-serif; }
  [data-theme="light"] .leaflet-container { background:#c8d8e8 !important; }
  .leaflet-popup-content-wrapper { background:rgba(11,18,32,0.97)!important; border:1px solid rgba(139,92,246,0.25)!important; border-radius:12px!important; box-shadow:0 8px 32px rgba(0,0,0,0.5)!important; color:#e2e8f0!important; }
  [data-theme="light"] .leaflet-popup-content-wrapper { background:rgba(255,255,255,0.97)!important; color:#1e293b!important; }
  .leaflet-popup-tip { background:rgba(11,18,32,0.97)!important; }
  [data-theme="light"] .leaflet-popup-tip { background:rgba(255,255,255,0.97)!important; }
  .leaflet-popup-content { margin:12px 16px!important; font-size:13px!important; line-height:1.6!important; }
  .leaflet-routing-container { background:rgba(11,18,32,0.95)!important; border:1px solid rgba(139,92,246,0.20)!important; border-radius:12px!important; color:#e2e8f0!important; font-family:'DM Sans',sans-serif!important; font-size:12px!important; box-shadow:0 4px 20px rgba(0,0,0,0.4)!important; max-height:220px!important; overflow-y:auto!important; }
  [data-theme="light"] .leaflet-routing-container { background:rgba(255,255,255,0.97)!important; color:#1e293b!important; }
  .leaflet-routing-alt { background:transparent!important; border:none!important; }
  .leaflet-routing-alt h2,.leaflet-routing-alt h3 { color:#c4b5fd!important; font-size:12px!important; }
  .leaflet-routing-alt td { color:#94a3b8!important; padding:3px 6px!important; }
  [data-theme="light"] .leaflet-routing-alt td { color:#475569!important; }
  .leaflet-bar a { background:rgba(11,18,32,0.9)!important; border:1px solid rgba(139,92,246,0.20)!important; color:#c4b5fd!important; }
  [data-theme="light"] .leaflet-bar a { background:rgba(255,255,255,0.95)!important; }
  .leaflet-bar a:hover { background:rgba(139,92,246,0.10)!important; }
  .place-card { transition:all 0.18s ease; }
  .place-card:hover { transform:translateX(4px); border-color:rgba(139,92,246,0.35)!important; box-shadow:0 4px 20px rgba(139,92,246,0.12)!important; }
  .route-btn { transition:all 0.15s ease!important; }
  .route-btn:hover { background:rgba(139,92,246,0.20)!important; transform:translateY(-1px); }
`;
document.head.appendChild(globalStyle);

// ── Load script helper ────────────────────────────────────────────────────────
function loadScript(src, id) {
  return new Promise((res, rej) => {
    if (document.getElementById(id)) { res(); return; }
    const s = document.createElement("script");
    s.id = id; s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

// ── Friendly Firebase errors ──────────────────────────────────────────────────
const friendlyError = (code) => ({
  "auth/email-already-in-use": "This email is already registered.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password. Try again.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/too-many-requests": "Too many attempts. Please wait.",
  "auth/operation-not-allowed": "Email/Password sign-in not enabled in Firebase Console.",
}[code] || "Something went wrong. Please try again.");

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function apiFetchWithFallback(paths, options) {
  let lastError = null;

  for (const path of paths) {
    try {
      const res = await fetch(`${API_BASE}${path}`, options);
      if (res.status !== 404) return res;
      lastError = new Error("Not Found");
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Request failed");
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║  NEARBY MAP COMPONENT (Leaflet + Leaflet-Routing-Machine)           ║
// ╚══════════════════════════════════════════════════════════════════════╝
function NearbyMap({ onClose, theme }) {
  const mapRef      = useRef(null);
  const mapObj      = useRef(null);
  const routeCtrl   = useRef(null);
  const userMarker  = useRef(null);
  const placeMarkers= useRef([]);

  const [status,   setStatus]   = useState("idle");
  const [errMsg,   setErrMsg]   = useState("");
  const [places,   setPlaces]   = useState([]);
  const [userPos,  setUserPos]  = useState(null);
  const [category, setCategory] = useState("hospital");
  const [radius,   setRadius]   = useState(3000);
  const [selected, setSelected] = useState(null);
  const [routeInfo,setRouteInfo]= useState(null);

  const isLight = theme === "light";

  const CATEGORIES = [
    { key:"hospital",  label:"🏥 Hospitals",  osm:'amenity=hospital' },
    { key:"clinic",    label:"🏨 Clinics",     osm:'amenity=clinic' },
    { key:"pharmacy",  label:"💊 Pharmacies",  osm:'amenity=pharmacy' },
    { key:"doctors",   label:"👨‍⚕️ Doctors",    osm:'amenity=doctors' },
    { key:"dentist",   label:"🦷 Dentists",    osm:'amenity=dentist' },
  ];

  const RADIUS_OPTIONS = [
    { label: "1 km", value: 1000 },
    { label: "3 km", value: 3000 },
    { label: "5 km", value: 5000 },
    { label: "10 km", value: 10000 },
    { label: "15 km", value: 15000 },
    { label: "20 km", value: 20000 },
    { label: "25 km", value: 25000 },
    { label: "30 km", value: 30000 },
    { label: "40 km", value: 40000 },
    { label: "50 km", value: 50000 },
  ];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "leaflet-js");
      await loadScript("https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js", "lrm-js");
      if (cancelled || !mapRef.current || mapObj.current) return;

      const L = window.L;
      const tileUrl = isLight
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([20.5937, 78.9629], 5);
      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
      mapObj.current = map;

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        placeUserMarker(lat, lng);
        setUserPos({ lat, lng });
        searchNearby(lat, lng, category, radius);
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const placeUserMarker = (lat, lng) => {
    const L = window.L;
    if (!L || !mapObj.current) return;
    if (userMarker.current) userMarker.current.remove();
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;border-radius:50%;background:#8b5cf6;border:3px solid #fff;box-shadow:0 0 0 4px rgba(139,92,246,0.30),0 0 12px rgba(139,92,246,0.50);animation:pulseGreen 2s infinite"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8],
    });
    userMarker.current = L.marker([lat, lng], { icon }).addTo(mapObj.current)
      .bindPopup('<div style="color:#c4b5fd;font-weight:700">📍 You are here</div>');
    mapObj.current.setView([lat, lng], 14);
  };

  const clearMarkers = () => {
    placeMarkers.current.forEach(m => m.remove());
    placeMarkers.current = [];
  };

  const searchNearby = async (lat, lng, cat, rad) => {
    setStatus("searching");
    setPlaces([]);
    setSelected(null);
    setRouteInfo(null);
    if (routeCtrl.current) { routeCtrl.current.remove(); routeCtrl.current = null; }
    clearMarkers();

    const catObj = CATEGORIES.find(c => c.key === cat) || CATEGORIES[0];
    const query = `
      [out:json][timeout:25];
      (
        node[${catObj.osm}](around:${rad},${lat},${lng});
        way[${catObj.osm}](around:${rad},${lat},${lng});
      );
      out center 30;
    `;

    try {
      const res  = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST", body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const json = await res.json();
      const L    = window.L;

      const results = (json.elements || []).map(el => {
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (!elLat || !elLng) return null;
        const dist = calcDist(lat, lng, elLat, elLng);
        return { id: el.id, name: el.tags?.name || catObj.label.replace(/./u,"").trim(), lat: elLat, lng: elLng, tags: el.tags || {}, dist };
      }).filter(Boolean).sort((a,b) => a.dist - b.dist);

      setPlaces(results);

      results.forEach((place, i) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${cat==="pharmacy"?"#f59e0b":cat==="doctors"||cat==="dentist"?"#a78bfa":"#ef4444"};display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);color:#fff;font-weight:700">${i+1}</div>`,
          iconSize:[28,28], iconAnchor:[14,14],
        });
        const m = L.marker([place.lat, place.lng], { icon })
          .addTo(mapObj.current)
          .bindPopup(`
            <div>
              <div style="font-weight:700;color:#c4b5fd;margin-bottom:4px">${place.name}</div>
              ${place.tags.phone ? `<div style="color:#94a3b8;font-size:11px">📞 ${place.tags.phone}</div>` : ""}
              ${place.tags["opening_hours"] ? `<div style="color:#94a3b8;font-size:11px">🕐 ${place.tags["opening_hours"]}</div>` : ""}
              <div style="color:#64748b;font-size:11px;margin-top:4px">${place.dist < 1 ? Math.round(place.dist*1000)+"m" : place.dist.toFixed(1)+"km"} away</div>
            </div>
          `);
        placeMarkers.current.push(m);
      });

      setStatus("done");
      if (results.length === 0) setErrMsg("No results found. Try increasing radius or changing category.");
      else setErrMsg("");

    } catch (e) {
      setErrMsg("Search failed. Check your connection and try again.");
      setStatus("error");
    }
  };

  const getRoute = (place) => {
    const L = window.L;
    if (!L || !mapObj.current || !userPos) return;
    setSelected(place);
    setRouteInfo(null);

    if (routeCtrl.current) { routeCtrl.current.remove(); routeCtrl.current = null; }

    const ctrl = L.Routing.control({
      waypoints: [
        L.latLng(userPos.lat, userPos.lng),
        L.latLng(place.lat, place.lng),
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: true,
      lineOptions: {
        styles: [
          { color: "#8b5cf6", weight: 5, opacity: 0.85 },
          { color: "#0ea5e9", weight: 3, opacity: 0.5, dashArray: "6 8" },
        ],
      },
      createMarker: () => null,
    }).addTo(mapObj.current);

    ctrl.on("routesfound", (e) => {
      const summary = e.routes[0].summary;
      setRouteInfo({
        distance: (summary.totalDistance / 1000).toFixed(1),
        time: Math.round(summary.totalTime / 60),
      });
    });

    routeCtrl.current = ctrl;
    mapObj.current.fitBounds(
      [[userPos.lat, userPos.lng], [place.lat, place.lng]],
      { padding: [40, 40] }
    );
  };

  const locateUser = () => {
    setStatus("locating"); setErrMsg("");
    if (!navigator.geolocation) { setErrMsg("Geolocation not supported."); setStatus("error"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        placeUserMarker(lat, lng);
        setUserPos({ lat, lng });
        searchNearby(lat, lng, category, radius);
      },
      (e) => {
        const m = { 1:"Location denied. Please allow in browser settings.", 2:"Location unavailable.", 3:"Timed out." };
        setErrMsg(m[e.code] || "Could not get location.");
        setStatus("error");
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const handleFilter = (cat, rad) => {
    setCategory(cat); setRadius(rad);
    if (userPos) searchNearby(userPos.lat, userPos.lng, cat, rad);
  };

  const calcDist = (la1, lo1, la2, lo2) => {
    const R=6371, dLa=((la2-la1)*Math.PI)/180, dLo=((lo2-lo1)*Math.PI)/180;
    const a=Math.sin(dLa/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  };

  const fmtDist = (d) => d < 1 ? Math.round(d*1000)+"m" : d.toFixed(1)+"km";
  const catColor = { hospital:"#ef4444", clinic:"#f97316", pharmacy:"#f59e0b", doctors:"#a78bfa", dentist:"#34d399" };

  const panelBg  = isLight ? "rgba(248,250,252,0.98)" : "rgba(2,6,23,0.8)";
  const headerBg = isLight ? "rgba(248,250,252,0.98)" : "rgba(11,18,32,0.95)";
  const cardBg   = isLight ? "rgba(255,255,255,0.90)" : "rgba(11,18,32,0.7)";
  const textPri  = isLight ? "#1e293b" : "#e2e8f0";
  const textMut  = isLight ? "#475569" : "#94a3b8";
  const textHint = isLight ? "#64748b" : "#64748b";
  const overlayBg= isLight ? "rgba(241,245,249,0.97)" : "rgba(2,6,23,0.97)";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background: overlayBg, display:"flex", flexDirection:"column", fontFamily:"'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ height:56, background: headerBg, backdropFilter:"blur(20px)", borderBottom:`1px solid rgba(139,92,246,0.15)`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#8b5cf6,#ec4899)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📍</div>
          <div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color: isLight ? "#1e293b" : "#f0fdfa", lineHeight:1 }}>Nearby Finder</div>
            <div style={{ fontSize:10, color:"#c4b5fd", fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase", marginTop:2 }}>
              {status==="done" ? `${places.length} results found` : status==="searching"||status==="locating" ? "Searching…" : "Click map or use GPS"}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {routeInfo && (
            <div style={{ display:"flex", gap:8, fontSize:12 }}>
              <span style={{ background:"rgba(139,92,246,0.12)", border:"1px solid rgba(139,92,246,0.25)", borderRadius:8, padding:"4px 10px", color:"#c4b5fd", fontWeight:700 }}>🗺 {routeInfo.distance} km</span>
              <span style={{ background:"rgba(14,165,233,0.12)", border:"1px solid rgba(14,165,233,0.25)", borderRadius:8, padding:"4px 10px", color:"#7dd3fc", fontWeight:700 }}>⏱ {routeInfo.time} min</span>
            </div>
          )}
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#fca5a5", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
            ✕
          </button>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* LEFT CONTROLS */}
        <div style={{ width:300, flexShrink:0, display:"flex", flexDirection:"column", borderRight:`1px solid rgba(139,92,246,0.10)`, background: panelBg, overflow:"hidden" }}>

          <div style={{ padding:"14px", borderBottom:`1px solid rgba(139,92,246,0.08)`, flexShrink:0 }}>
            <button onClick={locateUser} disabled={status==="locating"||status==="searching"}
              style={{ width:"100%", padding:"10px", marginBottom:12, background:"linear-gradient(135deg,#8b5cf6,#ec4899)", border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, cursor:(status==="locating"||status==="searching")?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", opacity:(status==="locating"||status==="searching")?0.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {status==="locating" ? <><span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⟳</span> Getting GPS…</> :
               status==="searching" ? <><span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⟳</span> Searching…</> :
               <>📍 Use My GPS Location</>}
            </button>

            <p style={{ fontSize:11, color: textHint, textAlign:"center", marginBottom:12, lineHeight:1.5 }}>
              — or click anywhere on the map —
            </p>

            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color: textHint, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:7 }}>Category</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => handleFilter(c.key, radius)}
                    style={{ padding:"5px 10px", borderRadius:16, border:`1px solid ${category===c.key ? catColor[c.key] : "rgba(255,255,255,0.07)"}`, background: category===c.key ? `${catColor[c.key]}22` : isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)", color: category===c.key ? catColor[c.key] : textHint, fontSize:11.5, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s ease" }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize:10, color: textHint, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:7 }}>Radius</div>
              <select
                value={radius}
                onChange={(e) => handleFilter(category, Number(e.target.value))}
                style={{
                  width:"100%",
                  padding:"10px 12px",
                  borderRadius:10,
                  border:"1px solid rgba(139,92,246,0.20)",
                  background: isLight ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.03)",
                  color: textPri,
                  fontSize:13,
                  fontWeight:600,
                  fontFamily:"'DM Sans',sans-serif",
                  outline:"none",
                  cursor:"pointer"
                }}
              >
                {RADIUS_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    style={{
                      background: isLight ? "#ffffff" : "#0b1220",
                      color: isLight ? "#1e293b" : "#e2e8f0"
                    }}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {errMsg && (
              <div style={{ marginTop:10, padding:"9px 12px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:9, color:"#fca5a5", fontSize:12, lineHeight:1.5 }}>
                ⚠️ {errMsg}
              </div>
            )}
          </div>

          {/* Results list */}
          <div style={{ flex:1, overflowY:"auto", padding:"10px" }}>

            {selected && routeInfo && (
              <div style={{ marginBottom:10, padding:"10px 12px", background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.20)", borderRadius:10 }}>
                <div style={{ fontSize:11, color:"#c4b5fd", fontWeight:700, marginBottom:4 }}>🗺 Route to {selected.name}</div>
                <div style={{ display:"flex", gap:10, fontSize:12 }}>
                  <span style={{ color: textPri }}>📏 {routeInfo.distance} km</span>
                  <span style={{ color: textPri }}>⏱ ~{routeInfo.time} min</span>
                </div>
              </div>
            )}

            {status==="idle" && (
              <div style={{ textAlign:"center", padding:"30px 10px", opacity:0.4 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🗺️</div>
                <div style={{ color: textMut, fontSize:13, lineHeight:1.6 }}>Use GPS or click the map to find nearby medical places</div>
              </div>
            )}
            {(status==="locating"||status==="searching") && (
              <div style={{ textAlign:"center", padding:"30px 10px" }}>
                <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:12 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:9,height:9,borderRadius:"50%",background:"#8b5cf6",animation:`blink 1.2s infinite ${i*0.2}s` }} />)}
                </div>
                <div style={{ color: textHint, fontSize:12 }}>Finding places near you…</div>
              </div>
            )}
            {status==="done" && places.length===0 && (
              <div style={{ textAlign:"center", padding:"30px 10px", opacity:0.5 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
                <div style={{ color: textMut, fontSize:13 }}>No results. Try a wider radius.</div>
              </div>
            )}

            {places.map((place, i) => (
              <div key={place.id} className="place-card"
                onClick={() => getRoute(place)}
                style={{ marginBottom:8, padding:"12px", background: selected?.id===place.id ? "rgba(139,92,246,0.10)" : cardBg, border:`1px solid ${selected?.id===place.id ? "rgba(139,92,246,0.35)" : "rgba(139,92,246,0.08)"}`, borderRadius:12, cursor:"pointer", backdropFilter:"blur(8px)" }}>

                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:`${catColor[category]}22`, border:`1px solid ${catColor[category]}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, color:catColor[category], fontWeight:700 }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: textPri, lineHeight:1.3, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {place.name}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:"#8b5cf6", fontWeight:700, background:"rgba(139,92,246,0.10)", padding:"2px 7px", borderRadius:6 }}>
                        {fmtDist(place.dist)}
                      </span>
                      {place.tags?.["opening_hours"] && (
                        <span style={{ fontSize:10, color: textHint }}>🕐 {place.tags["opening_hours"].slice(0,20)}</span>
                      )}
                    </div>
                    {place.tags?.phone && (
                      <div style={{ fontSize:11, color: textHint, marginTop:3 }}>📞 {place.tags.phone}</div>
                    )}
                  </div>
                </div>

                <button className="route-btn" onClick={(e) => { e.stopPropagation(); getRoute(place); }}
                  style={{ marginTop:8, width:"100%", padding:"6px", background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.15)", borderRadius:8, color:"#c4b5fd", fontSize:11.5, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  🗺 Get Directions
                </button>
              </div>
            ))}
          </div>

          <div style={{ padding:"10px 14px", borderTop:`1px solid rgba(139,92,246,0.08)`, flexShrink:0 }}>
            <p style={{ fontSize:10.5, color: textHint, lineHeight:1.5, textAlign:"center" }}>
              Powered by OpenStreetMap & Overpass API · No API key required<br/>
              Routing by Leaflet Routing Machine
            </p>
          </div>
        </div>

        {/* MAP */}
        <div style={{ flex:1, position:"relative" }}>
          <div ref={mapRef} style={{ width:"100%", height:"100%" }} />

          {status === "idle" && (
            <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", background: isLight ? "rgba(255,255,255,0.92)" : "rgba(11,18,32,0.9)", backdropFilter:"blur(12px)", border:`1px solid rgba(139,92,246,0.20)`, borderRadius:12, padding:"10px 18px", fontSize:13, color: textMut, whiteSpace:"nowrap", zIndex:500, pointerEvents:"none" }}>
              📍 Click anywhere on the map to search nearby
            </div>
          )}

          {selected && (
            <div style={{ position:"absolute", top:14, right:14, background: isLight ? "rgba(255,255,255,0.96)" : "rgba(11,18,32,0.92)", backdropFilter:"blur(16px)", border:`1px solid rgba(139,92,246,0.20)`, borderRadius:14, padding:"12px 16px", minWidth:220, maxWidth:280, zIndex:500, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:15, color:"#c4b5fd", marginBottom:4 }}>{selected.name}</div>
              {routeInfo ? (
                <div style={{ display:"flex", gap:10, fontSize:12 }}>
                  <span style={{ color: textPri }}>📏 {routeInfo.distance} km</span>
                  <span style={{ color: textPri }}>⏱ ~{routeInfo.time} min drive</span>
                </div>
              ) : (
                <div style={{ fontSize:12, color: textHint }}>Calculating route…</div>
              )}
              {selected.tags?.phone && <div style={{ fontSize:12, color: textHint, marginTop:4 }}>📞 {selected.tags.phone}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║  AUTH PAGE                                                          ║
// ╚══════════════════════════════════════════════════════════════════════╝
function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password || (!isLogin && !name)) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      if (isLogin) { const c = await signInWithEmailAndPassword(auth, email, password); onLogin(c.user); }
      else { const c = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(c.user, { displayName: name }); onLogin(c.user); }
    } catch (e) { setError(friendlyError(e.code)); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-secondary)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:"20px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,var(--glow-orb) 0%,transparent 65%)", top:"-200px", right:"-200px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,var(--glow-orb) 0%,transparent 65%)", bottom:"-180px", left:"-180px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" }} />
      <div className="auth-card" style={{ background:"var(--bg-card)", backdropFilter:"blur(24px)", border:"1px solid var(--border-subtle)", borderRadius:24, padding:"44px 40px", width:"100%", maxWidth:440, boxShadow:"0 32px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04)", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:36 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#8b5cf6,#ec4899)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 4px 16px rgba(139,92,246,0.35)" }}>🩺</div>
          <div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:"var(--text-darker)", letterSpacing:"-0.3px", lineHeight:1.1 }}>MediAssist AI</div>
            <div style={{ fontSize:11, color:"#c4b5fd", fontWeight:500, letterSpacing:"0.5px", textTransform:"uppercase", marginTop:2 }}>Health Intelligence Platform</div>
          </div>
        </div>
        <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:12, padding:4, marginBottom:28, border:"1px solid rgba(255,255,255,0.06)" }}>
          {["Sign In","Sign Up"].map((label,i) => { const active=(i===0)===isLogin; return (
            <button key={label} className="tab-btn" onClick={()=>{setIsLogin(i===0);setError("");}}
              style={{ flex:1, padding:"9px 0", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", background:active?"linear-gradient(135deg,#8b5cf6,#0d9488)":"transparent", color:active?"#fff":"var(--text-hint)", boxShadow:active?"0 2px 8px rgba(139,92,246,0.30)":"none" }}>
              {label}
            </button>
          ); })}
        </div>
        <p style={{ fontSize:13, color:"var(--text-hint)", marginBottom:24 }}>{isLogin?"Welcome back. Sign in to your health dashboard.":"Join thousands getting smarter health guidance."}</p>
        {!isLogin && (
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:12, color:"var(--text-secondary)", fontWeight:600, letterSpacing:"0.4px", textTransform:"uppercase", marginBottom:8 }}>Full Name</label>
            <input className="field-input" type="text" placeholder="Rahul Sharma" value={name} onChange={e=>setName(e.target.value)}
              style={{ width:"100%", padding:"12px 14px", background:"var(--bg-input)", border:"1px solid var(--border-medium)", borderRadius:12, color:"var(--text-primary)", fontSize:14, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 20px rgba(0,0,0,0.18)" }} />
          </div>
        )}
        {[["Email Address","email","you@email.com",email,setEmail],["Password","password",isLogin?"Your password":"Minimum 6 characters",password,setPassword]].map(([label,type,ph,val,setter])=>(
          <div key={label} style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:12, color:"var(--text-secondary)", fontWeight:600, letterSpacing:"0.4px", textTransform:"uppercase", marginBottom:8 }}>{label}</label>
            <input className="field-input" type={type} placeholder={ph} value={val} onChange={e=>setter(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
              style={{ width:"100%", padding:"12px 14px", background:"var(--bg-input)", border:"1px solid var(--border-medium)", borderRadius:12, color:"var(--text-primary)", fontSize:14, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 20px rgba(0,0,0,0.18)" }} />
          </div>
        ))}
        {error && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"11px 14px", color:"#fca5a5", fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}
        <button className="primary-btn" onClick={handleSubmit} disabled={loading}
          style={{ width:"100%", padding:"13px", background:"linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%)", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", opacity:loading?0.75:1, boxShadow:"0 6px 20px rgba(139,92,246,0.40)" }}>
          {loading ? "Please wait…" : isLogin ? "Sign In →" : "Create Account →"}
        </button>
        <p style={{ textAlign:"center", fontSize:13, color:"var(--text-hint)", marginTop:20 }}>
          {isLogin ? "No account? " : "Already registered? "}
          <span style={{ color:"#8b5cf6", cursor:"pointer", fontWeight:600 }} onClick={()=>{setIsLogin(!isLogin);setError("");}}>
            {isLogin ? "Sign Up free" : "Sign In"}
          </span>
        </p>
        <div style={{ marginTop:20, padding:"10px 14px", background:"rgba(139,92,246,0.06)", borderRadius:8, border:"1px solid rgba(139,92,246,0.10)" }}>
          <p style={{ fontSize:11, color:"#c4b5fd", textAlign:"center", lineHeight:1.5 }}>⚕️ For informational purposes only. Always consult a qualified doctor.</p>
        </div>
      </div>
    </div>
  );
}


const HEALTH_TOPICS = [
  {
    id: "hydration",
    title: "Hydration Basics",
    icon: "💧",
    summary: "Why water matters and how to stay hydrated.",
    points: [
      "Drink water regularly through the day, not only when very thirsty.",
      "Increase fluids during hot weather, fever, vomiting, or exercise.",
      "Dark yellow urine can be a sign you need more fluids.",
      "Seek medical help if you cannot keep fluids down or feel faint."
    ]
  },
  {
    id: "nutrition",
    title: "Healthy Eating",
    icon: "🥗",
    summary: "Simple daily food habits for better health.",
    points: [
      "Try to include fruits, vegetables, protein, and whole grains in meals.",
      "Limit excess sugary drinks, junk food, and very salty packaged foods.",
      "Eat at regular times and avoid skipping meals often.",
      "If you have diabetes, kidney disease, or pregnancy, follow doctor-specific advice."
    ]
  },
  {
    id: "sleep",
    title: "Sleep Health",
    icon: "😴",
    summary: "Basic habits for better sleep and recovery.",
    points: [
      "Most adults benefit from around 7 to 9 hours of sleep.",
      "Keep a consistent sleep and wake time every day.",
      "Reduce phone use and caffeine late in the evening.",
      "Talk to a doctor if snoring, insomnia, or daytime sleepiness is severe."
    ]
  },
  {
    id: "hygiene",
    title: "Personal Hygiene",
    icon: "🧼",
    summary: "Basic hygiene helps prevent many infections.",
    points: [
      "Wash hands before eating and after using the toilet.",
      "Keep wounds clean and covered until healed.",
      "Do not share towels, razors, or personal skin products.",
      "Clean affected skin gently and avoid scratching rashes."
    ]
  },
  {
    id: "exercise",
    title: "Daily Exercise",
    icon: "🏃",
    summary: "Movement improves heart, mood, and overall fitness.",
    points: [
      "Aim for regular walking or exercise most days of the week.",
      "Start slow if you are new to exercise and increase gradually.",
      "Stop and get help if you have chest pain, severe breathlessness, or dizziness.",
      "People with medical conditions should follow safe activity advice from a clinician."
    ]
  },
  {
    id: "first-aid",
    title: "Basic First Aid",
    icon: "🩹",
    summary: "Useful first steps before professional care.",
    points: [
      "For minor cuts, wash with clean water and cover with a clean dressing.",
      "For burns, cool under running water for around 20 minutes and avoid ice directly.",
      "For fever, rest, fluids, and monitoring are important.",
      "Go urgently for heavy bleeding, breathing trouble, unconsciousness, seizures, or chest pain."
    ]
  }
];

const createDefaultSession = () => ({
  id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  title: "New Chat",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [],
  latestReport: null,
});

function getSavedChatState() {
  try {
    const rawSessions = localStorage.getItem("mediassist_chat_sessions");
    const rawCurrentId = localStorage.getItem("mediassist_current_session_id");
    const legacyMessages = localStorage.getItem("mediassist_messages");
    const legacyReport = localStorage.getItem("mediassist_latest_report");

    let sessions = rawSessions ? JSON.parse(rawSessions) : [];
    if (!Array.isArray(sessions)) sessions = [];

    if (sessions.length === 0) {
      const migratedMessages = legacyMessages ? JSON.parse(legacyMessages) : [];
      const migratedReport = legacyReport ? JSON.parse(legacyReport) : null;
      const defaultSession = createDefaultSession();
      defaultSession.messages = Array.isArray(migratedMessages) ? migratedMessages : [];
      defaultSession.latestReport = migratedReport || null;
      if (defaultSession.messages.length > 0) {
        const firstUserMessage = defaultSession.messages.find((msg) => msg.sender === "user")?.text || "Medical Chat";
        defaultSession.title = firstUserMessage.slice(0, 28) || "Medical Chat";
      }
      sessions = [defaultSession];
    }

    const currentSessionId = sessions.some((session) => session.id === rawCurrentId)
      ? rawCurrentId
      : sessions[0].id;

    return { sessions, currentSessionId };
  } catch {
    const fallback = createDefaultSession();
    return { sessions: [fallback], currentSessionId: fallback.id };
  }
}

function HealthKnowledgeModal({ onClose, theme }) {
  const isLight = theme === "light";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1200, background:isLight ? "rgba(241,245,249,0.92)" : "rgba(2,6,23,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
      <div style={{ width:"100%", maxWidth:980, maxHeight:"90vh", overflow:"auto", background:"var(--bg-card-solid)", border:"1px solid var(--border-subtle)", borderRadius:24, padding:"24px", boxShadow:isLight ? "0 14px 40px rgba(0,0,0,0.12)" : "0 24px 80px rgba(0,0,0,0.45)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:"var(--text-primary)", marginBottom:6 }}>Basic Health Study</div>
            <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6 }}>Quick beginner-friendly health notes. These are for learning, not for confirmed diagnosis or personal treatment.</p>
          </div>
          <button onClick={onClose} style={{ width:40, height:40, borderRadius:12, border:"1px solid rgba(239,68,68,0.25)", background:"rgba(239,68,68,0.1)", color:"#f87171", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:16 }}>
          {HEALTH_TOPICS.map((topic) => (
            <div key={topic.id} style={{ background:"var(--bg-card)", border:"1px solid var(--border-subtle)", borderRadius:18, padding:"18px", boxShadow:isLight ? "0 8px 20px rgba(0,0,0,0.06)" : "0 10px 28px rgba(0,0,0,0.28)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:"rgba(139,92,246,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{topic.icon}</div>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{topic.title}</div>
                  <div style={{ fontSize:12, color:"#c4b5fd" }}>{topic.summary}</div>
                </div>
              </div>
              <ul style={{ paddingLeft:18, margin:0, color:"var(--text-secondary)", fontSize:13, lineHeight:1.7 }}>
                {topic.points.map((point, index) => <li key={index} style={{ marginBottom:6 }}>{point}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ marginTop:18, background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.18)", borderRadius:16, padding:"14px 16px", color:"#fca5a5", fontSize:12.5, lineHeight:1.6 }}>
          ⚕️ Learn here, but do not self-diagnose serious symptoms. For chest pain, severe breathing difficulty, unconsciousness, heavy bleeding, seizures, stroke signs, or worsening infection, get urgent medical help.
        </div>
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║  MAIN APP                                                           ║
// ╚══════════════════════════════════════════════════════════════════════╝
function App() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showMap, setShowMap]         = useState(false);

  // ── Theme state ────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("mediassist_theme") || "dark"; } catch { return "dark"; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = theme === "light" ? "#e2e8f0" : "#030712";
    document.body.style.transition = "background 0.3s ease";
    localStorage.setItem("mediassist_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  const isLight = theme === "light";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u||null); setAuthLoading(false); });
    return () => unsub();
  }, []);

  const handleLogout = async () => { await signOut(auth); setUser(null); };

  const savedChatState = getSavedChatState();
  const [message, setMessage]                   = useState("");
  const [chatSessions, setChatSessions]         = useState(savedChatState.sessions);
  const [currentSessionId, setCurrentSessionId] = useState(savedChatState.currentSessionId);
  const [loading, setLoading]                   = useState(false);
  const [language, setLanguage]                 = useState(()=>{ try{return localStorage.getItem("mediassist_language")||"en"}catch{return"en"} });
  const [age, setAge]                           = useState("");
  const [pregnancyStatus, setPregnancyStatus]   = useState("");
  const [allergies, setAllergies]               = useState("");
  const [existingConditions, setExistingConditions] = useState("");
  const [currentMedications, setCurrentMedications]= useState("");
  const [showPatientProfile, setShowPatientProfile] = useState(true);
  const [showHealthStudy, setShowHealthStudy]   = useState(false);
  const [skinImage, setSkinImage]               = useState(null);
  const [skinPreview, setSkinPreview]           = useState("");
  const [skinNotes, setSkinNotes]               = useState("");
  const [skinLoading, setSkinLoading]           = useState(false);
  const chatEndRef = useRef(null);

  const currentSession = chatSessions.find((session) => session.id === currentSessionId) || chatSessions[0];
  const messages = currentSession?.messages || [];
  const latestReport = currentSession?.latestReport || null;

  useEffect(() => {
    try {
      localStorage.setItem("mediassist_chat_sessions", JSON.stringify(chatSessions));
      localStorage.setItem("mediassist_current_session_id", currentSessionId);
      localStorage.setItem("mediassist_messages", JSON.stringify(messages));
      localStorage.setItem("mediassist_latest_report", JSON.stringify(latestReport));
    } catch {}
  }, [chatSessions, currentSessionId, messages, latestReport]);

  useEffect(()=>{ localStorage.setItem("mediassist_language",language); },[language]);
  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  const updateCurrentSession = (updater) => {
    setChatSessions((prev) => prev.map((session) => {
      if (session.id !== currentSessionId) return session;
      const updates = typeof updater === "function" ? updater(session) : updater;
      return {
        ...session,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  const isPatientProfileComplete = [age, pregnancyStatus, allergies, existingConditions, currentMedications]
    .every(value => value.trim() !== "");

  useEffect(() => {
    if (isPatientProfileComplete) setShowPatientProfile(false);
  }, [isPatientProfileComplete]);

  const speak = (text) => {
    const s = new SpeechSynthesisUtterance(text);
    s.lang = language==="hi"?"hi-IN":language==="mr"?"mr-IN":"en-IN";
    window.speechSynthesis.speak(s);
  };

  const startListening = () => {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Speech recognition not supported.");return;}
    const rec=new SR();
    rec.lang=language==="hi"?"hi-IN":language==="mr"?"mr-IN":"en-IN";
    rec.onresult=e=>setMessage(e.results[0][0].transcript);
    rec.start();
  };

  const sendMessage = async () => {
    if(!message.trim()||loading) return;
    const trimmedMessage = message.trim();

    updateCurrentSession((session) => ({
      title: session.messages.length === 0 ? trimmedMessage.slice(0, 28) || "Medical Chat" : session.title,
      messages: [...session.messages, {sender:"user",text:trimmedMessage}],
    }));

    setLoading(true);
    try {
      const token = user ? await user.getIdToken() : null;
      const res = await apiFetchWithFallback(["/api/chat", "/chat"],{
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({message: trimmedMessage, language, age, pregnancy_status:pregnancyStatus, allergies, existing_conditions:existingConditions, current_medications:currentMedications}),
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.detail||"Server error");
      const isEmergency =
        data.severity === "emergency" ||
        data.possible_disease?.toLowerCase().includes("emergency");
      updateCurrentSession((session) => ({
        messages: [...session.messages, {sender:"bot",data,isEmergency}],
        latestReport: data,
      }));
      isEmergency ? speak("Warning. Your symptoms may require urgent medical attention.") : speak(`${data.possible_disease}. ${data.symptom_summary}`);
    } catch(e) {
      updateCurrentSession((session) => ({
        messages: [...session.messages, {sender:"bot",text:`Error: ${e.message}`,isEmergency:false}],
      }));
    } finally { setLoading(false); setMessage(""); }
  };

  const handleSkinImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSkinImage(file);
    setSkinPreview(URL.createObjectURL(file));
  };

  const scanSkinImage = async () => {
    if (!skinImage || skinLoading) return;
    setSkinLoading(true);
    const uploadText = `Uploaded skin image${skinNotes.trim()?` — ${skinNotes.trim()}`:""}`;

    updateCurrentSession((session) => ({
      title: session.messages.length === 0 ? "Skin Scan Chat" : session.title,
      messages: [...session.messages, {sender:"user",text:uploadText}],
    }));

    try {
      const token = user ? await user.getIdToken() : null;
      const formData = new FormData();
      formData.append("image", skinImage);
      formData.append("language", language);
      formData.append("age", age);
      formData.append("pregnancy_status", pregnancyStatus);
      formData.append("allergies", allergies);
      formData.append("existing_conditions", existingConditions);
      formData.append("current_medications", currentMedications);
      formData.append("notes", skinNotes);

      const res = await apiFetchWithFallback(["/api/skin-scan", "/skin-scan"], {
        method: "POST",
        headers: { ...(token?{Authorization:`Bearer ${token}`}:{}) },
        body: formData,
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.detail||"Skin scan failed");
      updateCurrentSession((session) => ({
        messages: [...session.messages, {sender:"bot",data,isEmergency:false}],
        latestReport: data,
      }));
      speak(`${data.possible_disease}. ${data.symptom_summary}`);
      setSkinImage(null);
      setSkinPreview("");
      setSkinNotes("");
    } catch(e) {
      updateCurrentSession((session) => ({
        messages: [...session.messages, {sender:"bot",text:`Error: ${e.message}`,isEmergency:false}],
      }));
    } finally {
      setSkinLoading(false);
    }
  };

  const createNewChat = () => {
    const newSession = createDefaultSession();
    setChatSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessage("");
    setSkinImage(null);
    setSkinPreview("");
    setSkinNotes("");
  };

  const clearChat = () => {
    updateCurrentSession({ messages: [], latestReport: null, title: "New Chat" });
  };

  const deleteChatSession = (sessionId) => {
    setChatSessions((prev) => {
      if (prev.length === 1) {
        const replacement = createDefaultSession();
        setCurrentSessionId(replacement.id);
        return [replacement];
      }
      const filtered = prev.filter((session) => session.id !== sessionId);
      if (sessionId === currentSessionId && filtered.length > 0) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const downloadReport = () => {
    if(!latestReport){alert("No report to download yet.");return;}
    const t=`MediAssist AI — Medical Report\n${"=".repeat(40)}\n\nPossible Disease: ${latestReport.possible_disease||"N/A"}\nSummary: ${latestReport.symptom_summary||"N/A"}\n\nMedicines:\n${(latestReport.medicines||[]).map(i=>`  • ${i}`).join("\n")}\n\nDiet:\n${(latestReport.diet||[]).map(i=>`  • ${i}`).join("\n")}\n\nPrecautions:\n${(latestReport.precautions||[]).map(i=>`  • ${i}`).join("\n")}\n\nSee Doctor If:\n${(latestReport.see_doctor_if||[]).map(i=>`  • ${i}`).join("\n")}\n\nSafety Warnings:\n${(latestReport.safety_warnings||[]).map(i=>`  • ${i}`).join("\n")}\n\nDisclaimer: ${latestReport.disclaimer||""}`;
    const blob=new Blob([t],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="mediassist_report.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const renderBotCard = (msg) => {
    const d = msg.data;

    if (!d) return (
      <div style={{
        background: msg.isEmergency ? "rgba(220,38,38,0.12)" : isLight ? "rgba(139,92,246,0.07)" : "rgba(139,92,246,0.08)",
        border: `1px solid ${msg.isEmergency ? "rgba(220,38,38,0.3)" : "rgba(139,92,246,0.20)"}`,
        borderRadius: 14, padding: "14px 16px", maxWidth: "78%",
        color: msg.isEmergency ? "#fca5a5" : isLight ? "#1e293b" : "#ccfbf1",
        fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line"
      }}>
        {msg.text}
      </div>
    );

    return (
      <div style={{
        background: msg.isEmergency ? "rgba(220,38,38,0.08)" : "var(--bg-card)",
        border: `1px solid ${msg.isEmergency ? "rgba(220,38,38,0.25)" : "var(--border-subtle)"}`,
        backdropFilter: "blur(18px)", borderRadius: 16, padding: "20px", maxWidth: "80%",
        color: "var(--text-primary)", fontSize: 13.5, lineHeight: 1.7,
        boxShadow: isLight ? "0 4px 20px rgba(0,0,0,0.08)" : "0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.08)"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14,
          borderBottom: `1px solid ${msg.isEmergency ? "rgba(220,38,38,0.2)" : "var(--border-subtle)"}`
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: msg.isEmergency ? "#ef4444" : "#8b5cf6",
            boxShadow: `0 0 8px ${msg.isEmergency ? "#ef4444" : "#8b5cf6"}`, flexShrink: 0
          }} />
          <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, color: msg.isEmergency ? "#fca5a5" : "#c4b5fd" }}>
            {d.possible_disease || "Medical Guidance"}
          </span>
          {d.severity && (
            <span style={{
              marginLeft: "auto",
              background: d.severity === "high" || d.severity === "emergency" ? "rgba(220,38,38,0.2)" : d.severity === "medium" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)",
              color: d.severity === "high" || d.severity === "emergency" ? "#fca5a5" : d.severity === "medium" ? "#fcd34d" : "#86efac",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)", textTransform: "uppercase"
            }}>
              {d.severity}
            </span>
          )}
          {msg.isEmergency && (
            <span style={{
              background: "rgba(220,38,38,0.2)", color: "#fca5a5", fontSize: 10,
              fontWeight: 700, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)", textTransform: "uppercase"
            }}>
              ⚠ Urgent
            </span>
          )}
        </div>

        {d.symptom_summary && (
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 14, fontStyle: "italic", lineHeight: 1.6 }}>
            {d.symptom_summary}
          </p>
        )}

        {d.follow_up_questions && d.follow_up_questions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
              ❓ Follow-up Questions
            </div>
            <ul style={{ paddingLeft: 0, listStyle: "none" }}>
              {d.follow_up_questions.map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4, color: "var(--text-primary)", fontSize: 13 }}>
                  <span style={{ color: "#38bdf8", marginTop: 3, flexShrink: 0 }}>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {[
          ["💊 Medicines", d.medicines, "#8b5cf6"],
          ["🥗 Diet", d.diet, "#22c55e"],
          ["🛡 Precautions", d.precautions, "#f59e0b"],
          ["🏥 See Doctor If", d.see_doctor_if, "#ef4444"],
          ["⚠️ Safety Warnings", d.safety_warnings, "#f97316"]
        ]
          .filter(([, arr]) => arr && arr.length > 0)
          .map(([title, arr, color]) => (
            <div key={title} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
                {title}
              </div>
              <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                {arr.map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4, color: "var(--text-primary)", fontSize: 13 }}>
                    <span style={{ color, marginTop: 3, flexShrink: 0 }}>›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        {d.disclaimer && (
          <div style={{
            marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: 11.5, color: "var(--text-hint)", fontStyle: "italic"
          }}>
            ⚕️ {d.disclaimer}
          </div>
        )}

        <button onClick={() => setShowMap(true)}
          style={{
            marginTop: 14, padding: "8px 14px", background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9, color: "#fca5a5",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s ease"
          }}>
          📍 Find Nearby Hospital / Clinic / Pharmacy
        </button>
      </div>
    );
  };

  // ── Loading / Auth gates ───────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg-secondary)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#8b5cf6,#ec4899)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🩺</div>
      <p style={{ color:"var(--text-hint)", fontSize:14 }}>Loading MediAssist AI…</p>
    </div>
  );
  if (!user) return <AuthPage onLogin={setUser} />;

  const placeholder = language==="hi"?"अपने लक्षण लिखें...":language==="mr"?"तुमची लक्षणे लिहा...":"Describe your symptoms…";

  return (
    <>
      {/* Map overlay */}
      {showMap && <NearbyMap onClose={() => setShowMap(false)} theme={theme} />}
      {showHealthStudy && <HealthKnowledgeModal onClose={() => setShowHealthStudy(false)} theme={theme} />}

      <div style={{ minHeight:"100vh", background:"var(--bg-primary)", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column", position:"relative", transition:"background 0.3s ease" }}>
        <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", top:-200, right:-200, width:600, height:600, borderRadius:"50%", background:`radial-gradient(circle,var(--glow-orb) 0%,transparent 65%)`, pointerEvents:"none", zIndex:0 }} />

        {/* TOP NAV */}
        <nav style={{ position:"sticky", top:0, zIndex:100, background:"var(--bg-nav)", backdropFilter:"blur(24px)", borderBottom:"1px solid var(--border-subtle)", padding:"0 26px", height:70, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow: isLight ? "0 4px 16px rgba(0,0,0,0.08)" : "0 10px 28px rgba(2,6,23,0.28)", transition:"background 0.3s ease" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#8b5cf6,#ec4899)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, boxShadow:"0 10px 24px rgba(139,92,246,0.35)" }}>🩺</div>
            <div>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:"var(--text-darker)", lineHeight:1.1 }}>MediAssist AI</div>
              <div style={{ fontSize:10, color:"#c4b5fd", fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase" }}>Health Intelligence</div>
            </div>

            <button onClick={() => setShowMap(true)}
              style={{ marginLeft:16, padding:"6px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:20, color:"#fca5a5", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6, transition:"all 0.2s ease" }}>
              📍 Nearby Finder
            </button>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* ── THEME TOGGLE BUTTON ── */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={isLight ? "Switch to dark mode" : "Switch to light mode"}
              style={{
                width:38, height:38, borderRadius:10,
                background: isLight ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.10)",
                border:"1px solid rgba(139,92,246,0.22)",
                color:"#c4b5fd", fontSize:17, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0
              }}
            >
              {isLight ? "🌙" : "☀️"}
            </button>

            <select value={language} onChange={e=>setLanguage(e.target.value)}
              style={{ padding:"9px 14px", background: isLight ? "rgba(139,92,246,0.08)" : "linear-gradient(135deg,rgba(139,92,246,0.14),rgba(14,165,233,0.12))", border:"1px solid rgba(94,234,212,0.45)", borderRadius:10, color: isLight ? "#5b21b6" : "#ccfbf1", fontSize:13.5, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none", boxShadow:"0 0 0 1px rgba(139,92,246,0.08), 0 8px 24px rgba(139,92,246,0.12)" }}>
              <option value="en">🇬🇧 English</option>
              <option value="hi">🇮🇳 Hindi</option>
              <option value="mr">🇮🇳 Marathi</option>
            </select>
            <div style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 10px", background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.15)", borderRadius:18, cursor:"pointer" }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:"linear-gradient(135deg,#8b5cf6,#ec4899)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff" }}>
                {(user.displayName||user.email||"U")[0].toUpperCase()}
              </div>
              <span style={{ fontSize:11, color:"var(--text-secondary)", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user.displayName||user.email}
              </span>
            </div>
            <button className="logout-btn" onClick={handleLogout}
              style={{ padding:"8px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, color:"#fca5a5", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 6px 16px rgba(2,6,23,0.18)" }}>
              Logout
            </button>
          </div>
        </nav>

        <div style={{ flex:1, display:"flex", maxWidth:1180, width:"100%", margin:"0 auto", padding:"28px 22px", gap:22, position:"relative", zIndex:1 }}>

          {/* LEFT SIDEBAR */}
          <aside style={{ width:272, flexShrink:0, display:"flex", flexDirection:"column", gap:16 }}>
            {showPatientProfile ? (
              <div style={{ background:"var(--bg-sidebar)", backdropFilter:"blur(18px)", border:"1px solid var(--border-subtle)", borderRadius:18, padding:"22px", boxShadow: isLight ? "0 8px 24px rgba(0,0,0,0.08)" : "0 12px 32px rgba(0,0,0,0.32), 0 0 0 1px rgba(139,92,246,0.06)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#c4b5fd", letterSpacing:"0.6px", textTransform:"uppercase" }}>📋 Patient Profile</div>
                  <button onClick={() => setShowPatientProfile(false)}
                    style={{ padding:"5px 8px", background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, color:"var(--text-secondary)", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                    Hide
                  </button>
                </div>
                {[["Age","text","e.g. 25",age,setAge],["Pregnancy Status","text","if applicable",pregnancyStatus,setPregnancyStatus],["Allergies","text","nuts, penicillin…",allergies,setAllergies],["Existing Conditions","text","diabetes, BP…",existingConditions,setExistingConditions],["Current Medications","text","metformin…",currentMedications,setCurrentMedications]].map(([label,type,ph,val,setter])=>(
                  <div key={label} style={{ marginBottom:12 }}>
                    <label style={{ display:"block", fontSize:10.5, color:"var(--text-hint)", fontWeight:600, letterSpacing:"0.3px", textTransform:"uppercase", marginBottom:5 }}>{label}</label>
                    <input className="section-input" type={type} placeholder={ph} value={val} onChange={e=>setter(e.target.value)}
                      style={{ width:"100%", padding:"9px 11px", background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", border:`1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)"}`, borderRadius:8, color:"var(--text-primary)", fontSize:12.5, fontFamily:"'DM Sans',sans-serif" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background:"var(--bg-sidebar)", backdropFilter:"blur(18px)", border:"1px solid var(--border-subtle)", borderRadius:16, padding:"16px 18px", boxShadow: isLight ? "0 6px 20px rgba(0,0,0,0.06)" : "0 10px 28px rgba(0,0,0,0.28), 0 0 0 1px rgba(139,92,246,0.05)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:isPatientProfileComplete ? "#c4b5fd" : "#fbbf24", letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:4 }}>
                      {isPatientProfileComplete ? "✅ Patient Profile Saved" : "📋 Patient Profile Hidden"}
                    </div>
                    <div style={{ fontSize:11.5, color:"var(--text-secondary)", lineHeight:1.5 }}>
                      {isPatientProfileComplete ? "Profile is filled and hidden to save space." : "Open profile again anytime to complete missing details."}
                    </div>
                  </div>
                  <button onClick={() => setShowPatientProfile(true)}
                    style={{ padding:"7px 10px", background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.18)", borderRadius:8, color:"#c4b5fd", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
                    Edit
                  </button>
                </div>
              </div>
            )}

            <div style={{ background:"var(--bg-sidebar)", backdropFilter:"blur(18px)", border:"1px solid var(--border-subtle)", borderRadius:18, padding:"18px", boxShadow: isLight ? "0 8px 24px rgba(0,0,0,0.08)" : "0 12px 32px rgba(0,0,0,0.32), 0 0 0 1px rgba(139,92,246,0.06)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#c4b5fd", letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:10 }}>🧴 Skin Disease Scanner</div>
              <p style={{ fontSize:11.5, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:12 }}>Upload a clear photo of the affected skin area for AI-based guidance.</p>
              <input type="file" accept="image/*" onChange={handleSkinImageChange}
                style={{ width:"100%", marginBottom:12, color:"var(--text-secondary)", fontSize:12, fontFamily:"'DM Sans',sans-serif" }} />
              {skinPreview && (
                <img src={skinPreview} alt="Skin preview" style={{ width:"100%", height:160, objectFit:"cover", borderRadius:12, marginBottom:12, border:"1px solid rgba(139,92,246,0.14)" }} />
              )}
              <textarea className="section-input" value={skinNotes} onChange={e=>setSkinNotes(e.target.value)} placeholder="Add notes like itching, pain, redness, or duration"
                style={{ width:"100%", minHeight:78, resize:"vertical", padding:"10px 11px", background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", border:`1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)"}`, borderRadius:10, color:"var(--text-primary)", fontSize:12.5, fontFamily:"'DM Sans',sans-serif", marginBottom:12 }} />
              <button className="action-btn" onClick={scanSkinImage} disabled={!skinImage || skinLoading}
                style={{ width:"100%", padding:"11px 12px", background:"linear-gradient(135deg,#8b5cf6,#ec4899)", border:"none", borderRadius:12, color:"#fff", fontSize:12.5, fontWeight:700, cursor:!skinImage||skinLoading?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", opacity:!skinImage||skinLoading?0.7:1, boxShadow:"0 8px 18px rgba(2,6,23,0.18)" }}>
                {skinLoading ? "Scanning..." : "Scan Skin Photo"}
              </button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button className="action-btn" onClick={createNewChat}
                style={{ padding:"11px 12px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.22)", borderRadius:12, color:"#86efac", fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 8px 18px rgba(2,6,23,0.18)" }}>
                ➕ New Chat
              </button>
              <button className="action-btn" onClick={clearChat}
                style={{ padding:"11px 12px", background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.22)", borderRadius:12, color:"#fca5a5", fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 8px 18px rgba(2,6,23,0.18)" }}>
                🗑 Clear Current Chat
              </button>
              <button className="action-btn" onClick={() => setShowHealthStudy(true)}
                style={{ padding:"11px 12px", background:"rgba(59,130,246,0.12)", border:"1px solid rgba(59,130,246,0.22)", borderRadius:12, color:"#93c5fd", fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 8px 18px rgba(2,6,23,0.18)" }}>
                📚 Basic Health Study
              </button>
              <button className="action-btn" onClick={downloadReport}
                style={{ padding:"11px 12px", background:"rgba(139,92,246,0.10)", border:"1px solid rgba(59,130,246,0.22)", borderRadius:12, color:"#c4b5fd", fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 8px 18px rgba(2,6,23,0.18)" }}>
                📄 Download Report
              </button>
              <button className="action-btn" onClick={() => setShowMap(true)}
                style={{ padding:"11px 12px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:12, color:"#fca5a5", fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 8px 18px rgba(2,6,23,0.18)" }}>
                📍 Find Nearby Hospital
              </button>
            </div>

            <div style={{ background:"var(--bg-sidebar)", backdropFilter:"blur(18px)", border:"1px solid var(--border-subtle)", borderRadius:18, padding:"18px", boxShadow: isLight ? "0 8px 24px rgba(0,0,0,0.08)" : "0 12px 32px rgba(0,0,0,0.32), 0 0 0 1px rgba(139,92,246,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#c4b5fd", letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:4 }}>🕘 Chat History</div>
                  <div style={{ fontSize:11.5, color:"var(--text-secondary)", lineHeight:1.5 }}>Your previous chats are saved in this browser.</div>
                </div>
                <span style={{ minWidth:28, height:28, borderRadius:10, background:"rgba(139,92,246,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#c4b5fd", fontSize:12, fontWeight:700 }}>{chatSessions.length}</span>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:240, overflowY:"auto" }}>
                {chatSessions.map((session) => (
                  <div key={session.id} style={{ display:"flex", gap:8, alignItems:"stretch" }}>
                    <button onClick={() => setCurrentSessionId(session.id)}
                      style={{ flex:1, textAlign:"left", padding:"10px 12px", background: session.id===currentSessionId ? "rgba(139,92,246,0.12)" : isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", border:`1px solid ${session.id===currentSessionId ? "rgba(139,92,246,0.28)" : "rgba(255,255,255,0.06)"}`, borderRadius:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                      <div style={{ fontSize:12.5, fontWeight:700, color:"var(--text-primary)", marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{session.title || "Medical Chat"}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{session.messages.length} messages</div>
                    </button>
                    <button onClick={() => deleteChatSession(session.id)}
                      style={{ width:38, borderRadius:12, background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.18)", color:"#fca5a5", cursor:"pointer", fontSize:14 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:"rgba(220,38,38,0.07)", border:"1px solid rgba(220,38,38,0.16)", borderRadius:14, padding:"16px", boxShadow:"0 10px 24px rgba(2,6,23,0.18)" }}>
              <p style={{ fontSize:11, color:"#f87171", lineHeight:1.6, margin:0 }}>⚕️ Informational only. Always consult a qualified doctor for diagnosis and treatment.</p>
            </div>
          </aside>

          {/* CHAT */}
          <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
            <div style={{ flex:1, background:"var(--bg-chat)", backdropFilter:"blur(20px)", border:"1px solid var(--border-subtle)", borderRadius:22, padding:"24px", overflowY:"auto", marginBottom:16, minHeight:420, maxHeight:"calc(100vh - 250px)", boxShadow: isLight ? "0 8px 30px rgba(0,0,0,0.08)" : "0 20px 55px rgba(2,6,23,0.42), 0 0 90px rgba(139,92,246,0.10)", display:"flex", flexDirection:"column", transition:"background 0.3s ease" }}>
              {messages.length===0 && (
                <div style={{ margin:"auto", textAlign:"center", opacity:0.5 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🩺</div>
                  <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:"#c4b5fd", marginBottom:8 }}>How can I help you today?</div>
                  <div style={{ fontSize:13, color:"var(--chat-empty-text)", maxWidth:280, margin:"0 auto", lineHeight:1.6 }}>Describe your symptoms and I'll provide guidance on possible conditions, medicines, and precautions.</div>
                </div>
              )}
              {messages.map((msg,i)=>(
                <div key={i} className={msg.sender==="user"?"msg-user":"msg-bot"}
                  style={{ display:"flex", justifyContent:msg.sender==="user"?"flex-end":"flex-start", marginBottom:14 }}>
                  {msg.sender==="user" ? (
                    <div style={{ background:"linear-gradient(135deg,#8b5cf6,#ec4899)", color:"#fff", padding:"11px 16px", borderRadius:"18px 18px 4px 18px", maxWidth:"70%", fontSize:14, lineHeight:1.6, boxShadow:"0 2px 12px rgba(139,92,246,0.25)" }}>{msg.text}</div>
                  ) : renderBotCard(msg)}
                </div>
              ))}
              {loading && (
                <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:14 }}>
                  <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-subtle)", borderRadius:"18px 18px 18px 4px", padding:"14px 18px", display:"flex", gap:6, alignItems:"center" }}>
                    {[0,1,2].map(j=><div key={j} style={{ width:7,height:7,borderRadius:"50%",background:"#8b5cf6",animation:"blink 1.2s infinite",animationDelay:`${j*0.2}s` }} />)}
                    <span style={{ fontSize:12, color:"var(--text-hint)", marginLeft:6 }}>Analyzing symptoms…</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display:"flex", gap:10, alignItems:"center", background:"var(--bg-card)", backdropFilter:"blur(16px)", border:"1px solid var(--border-subtle)", borderRadius:14, padding:"10px 12px", boxShadow: isLight ? "0 4px 16px rgba(0,0,0,0.06)" : "0 4px 20px rgba(0,0,0,0.2)", transition:"background 0.3s ease" }}>
              <input className="chat-input" type="text" value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder={placeholder}
                style={{ flex:1, background:"transparent", border:"none", color:"var(--text-primary)", fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", padding:"6px 8px" }} />
              <button className="mic-btn" onClick={startListening}
                style={{ width:40, height:40, borderRadius:12, background:"rgba(139,92,246,0.10)", border:"1px solid rgba(139,92,246,0.18)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, boxShadow:"0 4px 14px rgba(2,6,23,0.22)" }}>
                🎤
              </button>
              <button className="send-btn" onClick={sendMessage} disabled={loading}
                style={{ padding:"10px 22px", background:"linear-gradient(135deg,#8b5cf6,#ec4899)", border:"none", borderRadius:12, color:"#fff", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", flexShrink:0, opacity:loading?0.7:1, boxShadow:"0 6px 18px rgba(139,92,246,0.35)" }}>
                {loading ? "…" : "Send →"}
              </button>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;