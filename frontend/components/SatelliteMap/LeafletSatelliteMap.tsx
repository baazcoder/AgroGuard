"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, useMapEvents, ImageOverlay } from "react-leaflet";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LeafletSatelliteMapProps {
  center: [number, number];
  zoom: number;
  polygonPoints: [number, number][];
  drawingMode: boolean;
  onAddPoint: (point: [number, number]) => void;
  activeOverlay: "standard" | "satellite" | "ndvi";
  trueColorUrl?: string;
  ndviMapUrl?: string;
  userLocation?: [number, number] | null;
}

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function MapEventsHandler({
  drawingMode,
  onAddPoint
}: {
  drawingMode: boolean;
  onAddPoint: (point: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (drawingMode) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

export default function LeafletSatelliteMap({
  center,
  zoom,
  polygonPoints,
  drawingMode,
  onAddPoint,
  activeOverlay,
  trueColorUrl,
  ndviMapUrl,
  userLocation
}: LeafletSatelliteMapProps) {

  // Calculate polygon bounding box for image overlay
  const getBounds = (): L.LatLngBoundsExpression | null => {
    if (!polygonPoints || polygonPoints.length < 3) return null;
    const lats = polygonPoints.map(p => p[0]);
    const lngs = polygonPoints.map(p => p[1]);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];
  };

  const bounds = getBounds();

  return (
    <div className="relative w-full h-[450px] sm:h-[550px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapRecenter center={center} zoom={zoom} />
        <MapEventsHandler drawingMode={drawingMode} onAddPoint={onAddPoint} />

        {/* Base Map Tile Layer */}
        {activeOverlay === "satellite" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri World Imagery</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {/* User Geolocation Marker */}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="text-xs font-bold text-slate-900 p-1">
                📍 Your Location<br />
                <span className="text-[10px] text-slate-600 font-mono">
                  {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Drawn Polygon Points & Outline */}
        {polygonPoints.length > 0 && (
          <>
            {polygonPoints.map((pt, idx) => (
              <Marker key={idx} position={pt}>
                <Popup>
                  <span className="text-xs font-semibold">
                    Point {idx + 1}: {pt[0].toFixed(4)}, {pt[1].toFixed(4)}
                  </span>
                </Popup>
              </Marker>
            ))}

            <Polygon
              positions={polygonPoints}
              pathOptions={{
                color: "#10b981",
                fillColor: activeOverlay === "ndvi" ? "transparent" : "#10b981",
                fillOpacity: activeOverlay === "ndvi" ? 0.0 : 0.2,
                weight: 3,
                dashArray: drawingMode ? "4, 4" : undefined
              }}
            />
          </>
        )}

        {/* NDVI Colormap Image Overlay */}
        {activeOverlay === "ndvi" && ndviMapUrl && bounds && (
          <ImageOverlay
            url={ndviMapUrl}
            bounds={bounds}
            opacity={0.85}
          />
        )}

        {/* True Color Satellite Image Overlay */}
        {activeOverlay === "standard" && trueColorUrl && bounds && (
          <ImageOverlay
            url={trueColorUrl}
            bounds={bounds}
            opacity={0.85}
          />
        )}
      </MapContainer>

      {/* Drawing Instructions Banner Overlay */}
      {drawingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-pulse">
          <span>🎯 Click map points to draw farm polygon ({polygonPoints.length} points)</span>
        </div>
      )}
    </div>
  );
}
