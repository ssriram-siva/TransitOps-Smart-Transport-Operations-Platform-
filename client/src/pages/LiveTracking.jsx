import { useState, useEffect, useCallback, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  RefreshCw,
  Zap,
  ZapOff,
  Truck,
  Gauge,
  Clock,
  Radio,
  Wifi,
  WifiOff,
  Route,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  ArrowRight,
  User,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const vehicleColors = {
  truck: "#2563eb",
  bus: "#22c55e",
  van: "#f59e0b",
  trailer: "#8b5cf6",
  tanker: "#06b6d4",
};

const statusDot = {
  available: "#22c55e",
  on_trip: "#3b82f6",
};

const statusLabels = {
  available: "Available",
  on_trip: "On Trip",
};

function createVehicleIcon(type, status, heading) {
  const color = vehicleColors[type] || "#2563eb";
  const rotation = heading || 0;
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:36px;height:36px">
      <div style="
        background:${color};
        width:36px;height:36px;border-radius:10px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 16px ${color}55;border:2.5px solid white;
        transform:rotate(${rotation}deg);
        transition:transform 0.8s cubic-bezier(0.25,0.1,0.25,1);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M12 2 L16 10 L22 11 L17 16 L18 22 L12 19 L6 22 L7 16 L2 11 L8 10 Z"/>
        </svg>
      </div>
      <div style="
        position:absolute;top:-4px;right:-4px;
        width:12px;height:12px;border-radius:50%;
        background:${statusDot[status] || "#94a3b8"};
        border:2px solid white;
        ${status === "on_trip" ? "animation:pulse 2s infinite" : ""}
      "></div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

function createSpeedTrailIcon(speed) {
  const opacity = Math.min(1, speed / 80);
  return L.divIcon({
    className: "",
    html: `<div style="
      width:6px;height:6px;border-radius:50%;
      background:rgba(59,130,246,${opacity});
      border:1px solid rgba(59,130,246,${opacity * 0.5});
    "></div>`,
    iconSize: [6, 6],
    iconAnchor: [3, 3],
  });
}

function LiveTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showPaths, setShowPaths] = useState(true);
  const [hiddenPaths, setHiddenPaths] = useState(new Set());
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const pathsRef = useRef({});
  const trailDotsRef = useRef({});
  const animFrameRef = useRef({});
  const { api } = useAuth();
  const { connected, joinRoom, on, off } = useSocket();
  const intervalRef = useRef(null);

  const updateMarkerWithAnimation = (vehicleId, newLatLng, heading, type, status) => {
    const marker = markersRef.current[vehicleId];
    if (!marker) return;

    const map = mapInstanceRef.current;
    if (!map) return;

    const currentPos = marker.getLatLng();
    const startLat = currentPos.lat;
    const startLng = currentPos.lng;
    const endLat = newLatLng[0];
    const endLng = newLatLng[1];
    const dist = map.distance(currentPos, L.latLng(endLat, endLng));

    if (dist < 1) {
      marker.setLatLng(newLatLng);
      marker.setIcon(createVehicleIcon(type, status, heading));
      return;
    }

    if (animFrameRef.current[vehicleId]) {
      cancelAnimationFrame(animFrameRef.current[vehicleId]);
    }

    const duration = Math.min(1500, Math.max(300, dist * 50));
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const lat = startLat + (endLat - startLat) * ease;
      const lng = startLng + (endLng - startLng) * ease;
      marker.setLatLng([lat, lng]);
      marker.setIcon(createVehicleIcon(type, status, heading));

      if (t < 1) {
        animFrameRef.current[vehicleId] = requestAnimationFrame(animate);
      } else {
        delete animFrameRef.current[vehicleId];
      }
    };

    animFrameRef.current[vehicleId] = requestAnimationFrame(animate);
  };

  const updatePathLine = (vehicleId, pathData, color) => {
    if (!showPaths || hiddenPaths.has(vehicleId)) {
      if (pathsRef.current[vehicleId]) {
        mapInstanceRef.current?.removeLayer(pathsRef.current[vehicleId]);
        delete pathsRef.current[vehicleId];
      }
      return;
    }

    const map = mapInstanceRef.current;
    if (!map || !pathData || pathData.length < 2) return;

    const latlngs = pathData.map((p) => [p[0], p[1]]);

    if (pathsRef.current[vehicleId]) {
      pathsRef.current[vehicleId].setLatLngs(latlngs);
    } else {
      pathsRef.current[vehicleId] = L.polyline(latlngs, {
        color: color || "#3b82f6",
        weight: 3,
        opacity: 0.7,
        dashArray: "8, 6",
        lineCap: "round",
        lineJoin: "round",
        className: "vehicle-path",
      }).addTo(map);
    }
  };

  const addTrailDot = (vehicleId, pathPoint) => {
    if (!showPaths || hiddenPaths.has(vehicleId)) return;
    const map = mapInstanceRef.current;
    if (!map || !pathPoint) return;

    const dot = L.circleMarker([pathPoint[0], pathPoint[1]], {
      radius: 2.5,
      color: "#3b82f6",
      fillColor: "#93c5fd",
      fillOpacity: 0.6,
      weight: 0,
    }).addTo(map);

    if (!trailDotsRef.current[vehicleId]) trailDotsRef.current[vehicleId] = [];
    trailDotsRef.current[vehicleId].push(dot);

    if (trailDotsRef.current[vehicleId].length > 100) {
      const old = trailDotsRef.current[vehicleId].shift();
      map.removeLayer(old);
    }
  };

  const buildPopup = (v) => {
    const trip = v.currentTrip;
    return `<div style="padding:6px;min-width:200px;font-family:system-ui,-apple-system,sans-serif">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <p style="font-weight:800;font-family:monospace;font-size:14px;margin:0;color:#0f172a">${v.registrationNumber}</p>
        <span style="
          font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;
          background:${v.status === "on_trip" ? "#eff6ff" : "#f0fdf4"};
          color:${v.status === "on_trip" ? "#2563eb" : "#16a34a"};
        ">${v.status === "on_trip" ? "ON TRIP" : "AVAILABLE"}</span>
      </div>
      <p style="font-size:12px;color:#64748b;margin:0 0 8px 0">${v.make} ${v.model}</p>
      ${v.location?.speed > 0 ? `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:#f8fafc;border-radius:6px;margin-bottom:8px">
          <span style="font-size:18px;font-weight:800;color:#0f172a">${Math.round(v.location.speed)}</span>
          <span style="font-size:10px;color:#94a3b8;line-height:1.2">km/h<br/>speed</span>
          <div style="flex:1"></div>
          <span style="font-size:10px;color:#94a3b8">Heading ${Math.round(v.location.heading || 0)}°</span>
        </div>
      ` : ""}
      ${trip ? `
        <div style="padding:6px 8px;background:#f0f9ff;border-radius:6px;border-left:3px solid #3b82f6">
          <p style="font-size:10px;color:#3b82f6;font-weight:700;margin:0 0 4px 0">ACTIVE TRIP</p>
          <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#334155;font-weight:600">
            <span>${trip.origin}</span>
            <span style="color:#94a3b8">→</span>
            <span>${trip.destination}</span>
          </div>
          <p style="font-size:10px;color:#64748b;margin:3px 0 0 0">${trip.driver?.name || "Unknown"} ${trip.cargoWeight ? `• ${trip.cargoWeight} ${trip.cargoUnit === "tons" ? "T" : "kg"}` : ""}</p>
        </div>
      ` : ""}
      ${v.location?.updatedAt ? `
        <p style="font-size:9px;color:#94a3b8;margin:6px 0 0;text-align:right">Last seen ${new Date(v.location.updatedAt).toLocaleTimeString()}</p>
      ` : ""}
    </div>`;
  };

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await api.get("/tracking");
      setVehicles(res.data.vehicles);
      setLastUpdate(new Date());

      const map = mapInstanceRef.current;
      if (!map) return;

      const positions = [];
      res.data.vehicles.forEach((v) => {
        if (!v.location?.lat || !v.location?.lng) return;
        const pos = [v.location.lat, v.location.lng];
        positions.push(pos);

        if (markersRef.current[v._id]) {
          markersRef.current[v._id].setLatLng(pos);
          markersRef.current[v._id].setIcon(
            createVehicleIcon(v.type, v.status, v.location?.heading)
          );
          markersRef.current[v._id].setPopupContent(buildPopup(v));
        } else {
          const marker = L.marker(pos, {
            icon: createVehicleIcon(v.type, v.status, v.location?.heading),
          })
            .addTo(map)
            .bindPopup(buildPopup(v), { maxWidth: 280 })
            .on("click", () => setSelectedVehicle(v._id));
          markersRef.current[v._id] = marker;
        }

        if (v.pathHistory && v.pathHistory.length >= 2) {
          updatePathLine(v._id, v.pathHistory, vehicleColors[v.type]);
        }
      });

      if (positions.length > 0) {
        map.fitBounds(positions, { padding: [60, 60], maxZoom: 12 });
      }
    } catch (err) {
      toast.error("Failed to load vehicle positions");
    } finally {
      setLoading(false);
    }
  }, [showPaths, hiddenPaths]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.6; }
      }
      .vehicle-path {
        animation: dashMove 1.5s linear infinite;
      }
      @keyframes dashMove {
        to { stroke-dashoffset: -28; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
      pathsRef.current = {};
      trailDotsRef.current = {};
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!loading && mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current.invalidateSize(), 100);
    }
  }, [loading]);

  useEffect(() => {
    fetchVehicles();
    joinRoom("tracking");
  }, []);

  useEffect(() => {
    const handleLocationUpdate = (data) => {
      setVehicles((prev) => {
        const idx = prev.findIndex((v) => v._id === data.vehicleId);
        const updated = {
          _id: data.vehicleId,
          registrationNumber: data.registrationNumber,
          type: data.type,
          make: data.make,
          model: data.model,
          status: data.status,
          location: data.location,
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...updated };
          return next;
        }
        return [...prev, updated];
      });

      setLastUpdate(new Date());

      const map = mapInstanceRef.current;
      if (!map) return;

      const pos = [data.location.lat, data.location.lng];
      const newLatLng = L.latLng(pos);

      if (markersRef.current[data.vehicleId]) {
        updateMarkerWithAnimation(
          data.vehicleId,
          pos,
          data.location.heading,
          data.type,
          data.status
        );
        markersRef.current[data.vehicleId].setPopupContent(
          buildPopup({
            ...data,
            location: data.location,
          })
        );
      } else {
        const marker = L.marker(pos, {
          icon: createVehicleIcon(data.type, data.status, data.location.heading),
        })
          .addTo(map)
          .bindPopup(
            buildPopup({ ...data, location: data.location }),
            { maxWidth: 280 }
          )
          .on("click", () => setSelectedVehicle(data.vehicleId));
        markersRef.current[data.vehicleId] = marker;
      }

      if (data.pathPoint && showPaths && !hiddenPaths.has(data.vehicleId)) {
        addTrailDot(data.vehicleId, data.pathPoint);

        if (!pathsRef.current[data.vehicleId]) {
          pathsRef.current[data.vehicleId] = L.polyline([], {
            color: vehicleColors[data.type] || "#3b82f6",
            weight: 3,
            opacity: 0.7,
            dashArray: "8, 6",
            lineCap: "round",
            lineJoin: "round",
            className: "vehicle-path",
          }).addTo(map);
        }
        pathsRef.current[data.vehicleId].addLatLng(newLatLng);
      }
    };

    const handlePathCleared = (data) => {
      if (pathsRef.current[data.vehicleId]) {
        mapInstanceRef.current?.removeLayer(pathsRef.current[data.vehicleId]);
        delete pathsRef.current[data.vehicleId];
      }
      if (trailDotsRef.current[data.vehicleId]) {
        trailDotsRef.current[data.vehicleId].forEach((dot) => {
          mapInstanceRef.current?.removeLayer(dot);
        });
        delete trailDotsRef.current[data.vehicleId];
      }
    };

    const handleAllPathsCleared = () => {
      Object.values(pathsRef.current).forEach((line) => {
        mapInstanceRef.current?.removeLayer(line);
      });
      Object.values(trailDotsRef.current).forEach((dots) => {
        dots.forEach((dot) => mapInstanceRef.current?.removeLayer(dot));
      });
      pathsRef.current = {};
      trailDotsRef.current = {};
    };

    on("vehicle:location", handleLocationUpdate);
    on("vehicle:pathCleared", handlePathCleared);
    on("all:pathsCleared", handleAllPathsCleared);
    return () => {
      off("vehicle:location", handleLocationUpdate);
      off("vehicle:pathCleared", handlePathCleared);
      off("all:pathsCleared", handleAllPathsCleared);
    };
  }, [on, off, showPaths, hiddenPaths]);

  const togglePath = (vehicleId) => {
    setHiddenPaths((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) {
        next.delete(vehicleId);
        if (pathsRef.current[vehicleId]) {
          pathsRef.current[vehicleId].addTo(mapInstanceRef.current);
        }
      } else {
        next.add(vehicleId);
        if (pathsRef.current[vehicleId]) {
          mapInstanceRef.current?.removeLayer(pathsRef.current[vehicleId]);
        }
      }
      return next;
    });
  };

  const clearPath = async (vehicleId) => {
    try {
      await api.delete(`/tracking/${vehicleId}/path`);
      if (pathsRef.current[vehicleId]) {
        mapInstanceRef.current?.removeLayer(pathsRef.current[vehicleId]);
        delete pathsRef.current[vehicleId];
      }
      if (trailDotsRef.current[vehicleId]) {
        trailDotsRef.current[vehicleId].forEach((dot) => {
          mapInstanceRef.current?.removeLayer(dot);
        });
        delete trailDotsRef.current[vehicleId];
      }
      toast.success("Path cleared");
    } catch {
      toast.error("Failed to clear path");
    }
  };

  const clearAllPaths = async () => {
    try {
      await api.delete("/tracking/all/paths");
      Object.values(pathsRef.current).forEach((line) => {
        mapInstanceRef.current?.removeLayer(line);
      });
      Object.values(trailDotsRef.current).forEach((dots) => {
        dots.forEach((dot) => mapInstanceRef.current?.removeLayer(dot));
      });
      pathsRef.current = {};
      trailDotsRef.current = {};
      toast.success("All paths cleared");
    } catch {
      toast.error("Failed to clear paths");
    }
  };

  const startSimulation = async () => {
    setSimulating(true);
    try {
      await api.post("/tracking/simulate");
      toast.success("Location simulation triggered");
    } catch {
      toast.error("Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  const startAutoRefresh = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(async () => {
      try {
        await api.post("/tracking/simulate");
      } catch {}
    }, 3000);
    toast.success("Auto-refresh started (every 3s)");
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      toast.success("Auto-refresh stopped");
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      Object.values(animFrameRef.current).forEach((id) => cancelAnimationFrame(id));
    };
  }, []);

  const selected = selectedVehicle
    ? vehicles.find((v) => v._id === selectedVehicle)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-dark-900 tracking-tight">
            Live Fleet Tracking
          </h1>
          <p className="text-dark-400 mt-1">
            Real-time vehicle positions, paths, and movement
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
              connected
                ? "bg-secondary-50 text-secondary-700"
                : "bg-danger-50 text-danger-700"
            }`}
          >
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? "Connected" : "Disconnected"}
          </div>
          {lastUpdate && (
            <span className="text-xs text-dark-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchVehicles} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowPaths(!showPaths)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              showPaths ? "bg-primary-50 text-primary-700" : "bg-dark-100 text-dark-500"
            }`}
            title={showPaths ? "Hide all paths" : "Show all paths"}
          >
            {showPaths ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Paths
          </button>
          <button onClick={clearAllPaths} className="btn-secondary flex items-center gap-2 text-sm" title="Clear all paths">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={startSimulation}
            disabled={simulating}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Simulate
          </button>
          {intervalRef.current ? (
            <button onClick={stopAutoRefresh} className="btn-danger flex items-center gap-2 text-sm">
              <ZapOff className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button onClick={startAutoRefresh} className="btn-primary flex items-center gap-2 text-sm">
              <Radio className="w-4 h-4" />
              Go Live
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: "calc(100vh - 240px)" }}>
        <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-sm border border-dark-100/50 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-100">
              <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          )}
          <div ref={mapRef} className="h-full w-full" />
        </div>

        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="card p-4">
            <h3 className="text-sm font-bold text-dark-900 mb-3">Fleet Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-secondary-700">
                  {vehicles.filter((v) => v.status === "available").length}
                </p>
                <p className="text-[10px] text-secondary-600 font-medium">Available</p>
              </div>
              <div className="bg-primary-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary-700">
                  {vehicles.filter((v) => v.status === "on_trip").length}
                </p>
                <p className="text-[10px] text-primary-600 font-medium">On Trip</p>
              </div>
            </div>
          </div>

          <div className="card p-0 flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-dark-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-dark-900">
                Vehicles ({vehicles.length})
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-dark-400">
                <Route className="w-3 h-3" />
                {Object.keys(pathsRef.current).length} trails
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {vehicles.length === 0 ? (
                <div className="p-6 text-center">
                  <Truck className="w-8 h-8 text-dark-300 mx-auto mb-2" />
                  <p className="text-xs text-dark-400">No vehicles on map</p>
                </div>
              ) : (
                vehicles.map((v) => (
                  <div
                    key={v._id}
                    className={`border-b border-dark-50 transition-colors ${
                      selectedVehicle === v._id ? "bg-primary-50" : "hover:bg-dark-50"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedVehicle(v._id);
                        if (v.location?.lat && mapInstanceRef.current) {
                          mapInstanceRef.current.setView([v.location.lat, v.location.lng], 15);
                          markersRef.current[v._id]?.openPopup();
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      <div className="relative">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ background: vehicleColors[v.type] || "#2563eb" }}
                        >
                          <Truck className="w-4 h-4 text-white" />
                        </div>
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                          style={{ background: statusDot[v.status] || "#94a3b8" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-bold text-dark-800 truncate">
                          {v.registrationNumber}
                        </p>
                        <p className="text-[10px] text-dark-400 truncate">
                          {v.make} {v.model}
                        </p>
                        {v.currentTrip && (
                          <p className="text-[9px] text-primary-600 font-medium truncate flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {v.currentTrip.origin} → {v.currentTrip.destination}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {v.location?.speed > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Gauge className="w-2.5 h-2.5 text-dark-400" />
                            <span className="text-[10px] font-bold text-dark-600">
                              {Math.round(v.location.speed)}
                            </span>
                            <span className="text-[8px] text-dark-400">km/h</span>
                          </div>
                        )}
                        {v.location?.heading != null && v.location?.speed > 0 && (
                          <span className="text-[8px] text-dark-300 font-mono">
                            {Math.round(v.location.heading)}°
                          </span>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-1 px-3 pb-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePath(v._id); }}
                        className={`p-1 rounded text-[10px] transition-colors ${
                          hiddenPaths.has(v._id) ? "text-dark-300 hover:text-dark-500" : "text-primary-500 hover:text-primary-700"
                        }`}
                        title={hiddenPaths.has(v._id) ? "Show path" : "Hide path"}
                      >
                        {hiddenPaths.has(v._id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); clearPath(v._id); }}
                        className="p-1 rounded text-dark-300 hover:text-danger-500 transition-colors"
                        title="Clear path"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {v.location?.updatedAt && (
                        <span className="text-[8px] text-dark-300 ml-auto">
                          {new Date(v.location.updatedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selected && (
            <div className="card p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-dark-900">Vehicle Details</h3>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-xs text-dark-400 hover:text-dark-600"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-dark-400">Registration</span>
                  <span className="font-mono font-bold">{selected.registrationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Type</span>
                  <span className="font-medium capitalize">{selected.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Status</span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${selected.status === "on_trip" ? "text-primary-600" : "text-secondary-600"}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusDot[selected.status] || "#94a3b8" }} />
                    {statusLabels[selected.status] || selected.status}
                  </span>
                </div>
                {selected.location?.speed > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Speed</span>
                      <span className="font-bold flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {Math.round(selected.location.speed)} km/h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Heading</span>
                      <span className="font-bold font-mono">{Math.round(selected.location.heading || 0)}°</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-dark-400">Lat</span>
                  <span className="font-mono">{selected.location?.lat?.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Lng</span>
                  <span className="font-mono">{selected.location?.lng?.toFixed(6)}</span>
                </div>
                {selected.currentTrip && (
                  <div className="pt-2 mt-2 border-t border-dark-100">
                    <p className="text-[10px] text-primary-600 font-bold mb-1.5 flex items-center gap-1">
                      <Route className="w-3 h-3" />
                      ACTIVE TRIP
                    </p>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-medium">{selected.currentTrip.origin}</span>
                      <ArrowRight className="w-3 h-3 text-dark-300" />
                      <span className="font-medium">{selected.currentTrip.destination}</span>
                    </div>
                    {selected.currentTrip.driver && (
                      <p className="text-[10px] text-dark-400 mt-1 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        {selected.currentTrip.driver.name}
                      </p>
                    )}
                  </div>
                )}
                {selected.location?.updatedAt && (
                  <div className="pt-2 mt-2 border-t border-dark-100 flex justify-between">
                    <span className="text-dark-400">Last seen</span>
                    <span className="text-dark-600">{new Date(selected.location.updatedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-dark-100">
                <button
                  onClick={() => togglePath(selected._id)}
                  className="btn-secondary text-[11px] flex-1 flex items-center justify-center gap-1.5"
                >
                  {hiddenPaths.has(selected._id) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {hiddenPaths.has(selected._id) ? "Show Path" : "Hide Path"}
                </button>
                <button
                  onClick={() => clearPath(selected._id)}
                  className="btn-secondary text-[11px] flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveTracking;
