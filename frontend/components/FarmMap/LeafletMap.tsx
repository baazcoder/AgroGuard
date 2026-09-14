"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { FieldData } from "@/lib/api";

// Fix Leaflet default marker icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  farmBoundary: [number, number][];
  fields: FieldData[];
  selectedFieldId: number | null;
  onSelectField: (field: FieldData) => void;
  onSelectFarm?: () => void;
  drawingMode: "none" | "draw_farm" | "draw_field";
  draftPoints: [number, number][];
  onAddDraftPoint: (point: [number, number]) => void;
  selectedMapPoint?: [number, number] | null;
  onSelectMapPoint?: (point: [number, number]) => void;
}

// Map updater sub-component to re-center smoothly
function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

// Map event listener for drawing points & map point selection
function MapEventsHandler({
  drawingMode,
  onAddDraftPoint,
  onSelectMapPoint
}: {
  drawingMode: "none" | "draw_farm" | "draw_field";
  onAddDraftPoint: (point: [number, number]) => void;
  onSelectMapPoint?: (point: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (drawingMode !== "none") {
        onAddDraftPoint([e.latlng.lat, e.latlng.lng]);
      } else if (onSelectMapPoint) {
        onSelectMapPoint([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

export default function LeafletMap({
  center,
  zoom,
  farmBoundary,
  fields,
  selectedFieldId,
  onSelectField,
  onSelectFarm,
  drawingMode,
  draftPoints,
  onAddDraftPoint,
  selectedMapPoint,
  onSelectMapPoint
}: LeafletMapProps) {
  
  // Health color mapping
  const getFieldColor = (status: string) => {
    switch (status) {
      case "Healthy":
        return "#10b981"; // Green
      case "Monitor":
        return "#eab308"; // Yellow
      case "Disease Risk":
        return "#f97316"; // Orange
      case "High Disease Risk":
        return "#ef4444"; // Red
      default:
        return "#3b82f6"; // Blue default
    }
  };

  return (
    <div className="relative w-full h-[450px] sm:h-[550px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapRecenter center={center} zoom={zoom} />
        <MapEventsHandler drawingMode={drawingMode} onAddDraftPoint={onAddDraftPoint} onSelectMapPoint={onSelectMapPoint} />

        {/* Selected Map Point Marker */}
        {selectedMapPoint && (
          <Marker position={selectedMapPoint}>
            <Popup>
              <div className="text-xs font-bold p-1 text-slate-900">
                📍 Selected Map Area<br />
                <span className="text-[10px] text-slate-600 font-mono">
                  {selectedMapPoint[0].toFixed(4)}, {selectedMapPoint[1].toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Farm Outer Boundary Polygon (Dotted Amber Outline) */}
        {farmBoundary && farmBoundary.length >= 3 && (
          <Polygon
            positions={farmBoundary}
            pathOptions={{
              color: "#f59e0b",
              fillColor: "#f59e0b",
              fillOpacity: 0.08,
              weight: 3,
              dashArray: "6, 6"
            }}
            eventHandlers={{
              click: (e) => {
                if (drawingMode === "none" && onSelectFarm) {
                  L.DomEvent.stopPropagation(e);
                  onSelectFarm();
                }
              }
            }}
          >
            <Tooltip permanent direction="center" className="farm-label">
              <span className="text-xs font-bold text-amber-300 bg-slate-950/80 px-2 py-1 rounded shadow cursor-pointer">
                🚜 Farm Boundary (Click to inspect Farm Profile)
              </span>
            </Tooltip>
          </Polygon>
        )}

        {/* Individual Fields Polygons */}
        {fields.map((field) => {
          const coords = field.boundary_coordinates;
          if (!coords || coords.length < 3) return null;
          const isSelected = selectedFieldId === field.id;
          const strokeColor = getFieldColor(field.health_status);

          return (
            <Polygon
              key={field.id}
              positions={coords as [number, number][]}
              pathOptions={{
                color: isSelected ? "#ffffff" : strokeColor,
                fillColor: strokeColor,
                fillOpacity: isSelected ? 0.6 : 0.35,
                weight: isSelected ? 4 : 2,
              }}
              eventHandlers={{
                click: (e) => {
                  if (drawingMode === "none") {
                    L.DomEvent.stopPropagation(e);
                    onSelectField(field);
                  }
                }
              }}
            >
              <Tooltip permanent={true} direction="center">
                <div className="text-center text-xs font-bold bg-slate-900/90 text-white px-2 py-1 rounded border border-slate-700 shadow-lg">
                  <div>{field.name}</div>
                  <div className="text-[10px] text-slate-300">{field.crop} • {field.area_acres} acres</div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase px-1 rounded inline-block"
                       style={{ backgroundColor: `${strokeColor}44`, color: strokeColor }}>
                    {field.health_status}
                  </div>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Draft Polygon Points while drawing */}
        {draftPoints.length > 0 && (
          <>
            {draftPoints.map((pt, idx) => (
              <Marker key={idx} position={pt}>
                <Popup>
                  <span className="text-xs font-semibold">
                    Point {idx + 1}: {pt[0].toFixed(4)}, {pt[1].toFixed(4)}
                  </span>
                </Popup>
              </Marker>
            ))}
            {draftPoints.length >= 2 && (
              <Polygon
                positions={draftPoints}
                pathOptions={{
                  color: "#06b6d4",
                  fillColor: "#06b6d4",
                  fillOpacity: 0.25,
                  weight: 2,
                  dashArray: "4, 4"
                }}
              />
            )}
          </>
        )}
      </MapContainer>

      {/* Map Drawing Helper Overlay */}
      {drawingMode !== "none" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 border border-cyan-500/50 text-cyan-200 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-medium flex items-center gap-2 animate-pulse">
          <span>🎯 Click on map to place polygon points ({draftPoints.length} points added)</span>
        </div>
      )}
    </div>
  );
}
