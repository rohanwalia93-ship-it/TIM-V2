"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

export interface PortfolioMapPin {
  id: string;
  name: string;
  lat: number;
  lon: number;
  stageLabel: string;
  recommendation?: string | null;
}

const COLOR_BY_RECOMMENDATION: Record<string, string> = {
  PROCEED: "#1a7a4c",
  PROCEED_SUBJECT_TO_CONDITIONS: "#a3660b",
  PILOT_PHASE: "#a3660b",
  DEFER_PENDING_EVIDENCE: "#948a7c",
  DO_NOT_PROCEED: "#b3261e",
};

function pinIcon(color: string) {
  return new L.DivIcon({
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 2px ${color}"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function PortfolioMapInner({ pins }: { pins: PortfolioMapPin[] }) {
  const withCoords = pins.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  const center: [number, number] =
    withCoords.length > 0
      ? [withCoords.reduce((s, p) => s + p.lat, 0) / withCoords.length, withCoords.reduce((s, p) => s + p.lon, 0) / withCoords.length]
      : [24.4539, 54.3773];

  return (
    <MapContainer center={center} zoom={4} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withCoords.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lon]} icon={pinIcon(COLOR_BY_RECOMMENDATION[p.recommendation ?? ""] ?? "#d9502f")}>
          <Popup>
            <strong>{p.name}</strong>
            <br />
            {p.stageLabel}
            {p.recommendation ? <><br />{p.recommendation.replaceAll("_", " ")}</> : null}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
