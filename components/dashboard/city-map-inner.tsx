"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

const cityIcon = new L.DivIcon({
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#4f46e5;border:2px solid white;box-shadow:0 0 0 2px #4f46e5"></div>',
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const poiIcon = new L.DivIcon({
  html: '<div style="width:8px;height:8px;border-radius:9999px;background:#059669;border:1.5px solid white"></div>',
  className: "",
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const airportIcon = new L.DivIcon({
  html: '<div style="width:8px;height:8px;border-radius:9999px;background:#d97706;border:1.5px solid white"></div>',
  className: "",
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

export interface MapPoi {
  id: number | string;
  name: string;
  lat: number;
  lon: number;
  kind: "attraction" | "airport";
}

export function CityMapInner({
  lat,
  lon,
  pois,
}: {
  lat: number;
  lon: number;
  pois: MapPoi[];
}) {
  return (
    <MapContainer center={[lat, lon]} zoom={9} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lon]} icon={cityIcon}>
        <Popup>City center</Popup>
      </Marker>
      <Circle center={[lat, lon]} radius={50_000} pathOptions={{ color: "#4f46e5", fillOpacity: 0.03, weight: 1 }} />
      <Circle center={[lat, lon]} radius={100_000} pathOptions={{ color: "#4f46e5", fillOpacity: 0.02, weight: 1, dashArray: "4 4" }} />
      {pois.map((p) => (
        <Marker key={`${p.kind}-${p.id}`} position={[p.lat, p.lon]} icon={p.kind === "airport" ? airportIcon : poiIcon}>
          <Popup>{p.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
