import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export const vehicleIcons = {
  truck: L.divIcon({
    className: "custom-vehicle-marker",
    html: `<div style="background:#2563eb;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,0.4);border:2px solid white">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  }),
  bus: L.divIcon({
    className: "custom-vehicle-marker",
    html: `<div style="background:#22c55e;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(34,197,94,0.4);border:2px solid white">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="21" x2="7" y2="17"/><line x1="17" y1="21" x2="17" y2="17"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  }),
  van: L.divIcon({
    className: "custom-vehicle-marker",
    html: `<div style="background:#f59e0b;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(245,158,11,0.4);border:2px solid white">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  }),
  trailer: L.divIcon({
    className: "custom-vehicle-marker",
    html: `<div style="background:#8b5cf6;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(139,92,246,0.4);border:2px solid white">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><circle cx="7" cy="20" r="2"/><circle cx="17" cy="20" r="2"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  }),
  tanker: L.divIcon({
    className: "custom-vehicle-marker",
    html: `<div style="background:#06b6d4;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(6,182,212,0.4);border:2px solid white">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  }),
};

export default L;
