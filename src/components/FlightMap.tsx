"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Flight } from "./FlightCard";
import { AIRPORTS } from "@/lib/airports";

interface FlightMapProps {
  flights: Flight[];
}

// Generate points along a great circle arc between two coordinates
function generateGreatCircleArc(
  start: [number, number],
  end: [number, number],
  numPoints: number = 50
): [number, number][] {
  const points: [number, number][] = [];

  const lat1 = (start[1] * Math.PI) / 180;
  const lon1 = (start[0] * Math.PI) / 180;
  const lat2 = (end[1] * Math.PI) / 180;
  const lon2 = (end[0] * Math.PI) / 180;

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;

    // Haversine intermediate point formula
    const d =
      2 *
      Math.asin(
        Math.sqrt(
          Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
            Math.cos(lat1) *
              Math.cos(lat2) *
              Math.pow(Math.sin((lon2 - lon1) / 2), 2)
        )
      );

    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x =
      A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y =
      A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);

    points.push([(lon * 180) / Math.PI, (lat * 180) / Math.PI]);
  }

  return points;
}

export default function FlightMap({ flights }: FlightMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Mapbox token not found");
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 30],
      zoom: 1.5,
      projection: "globe",
    });

    map.current.on("load", () => {
      setIsLoaded(true);

      // Add atmosphere effect for globe view
      map.current?.setFog({
        color: "rgb(13, 13, 13)",
        "high-color": "rgb(26, 26, 26)",
        "horizon-blend": 0.02,
        "space-color": "rgb(13, 13, 13)",
        "star-intensity": 0.3,
      });
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add flight routes and airport markers when map is loaded and flights change
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remove existing layers and sources
    const existingLayers = ["flight-routes", "airport-points", "airport-labels"];
    existingLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.removeLayer(layer);
      }
    });

    const existingSources = ["routes", "airports"];
    existingSources.forEach((source) => {
      if (map.current?.getSource(source)) {
        map.current.removeSource(source);
      }
    });

    // Build route features from flights
    const routeFeatures: GeoJSON.Feature[] = [];
    const airportCounts: Record<string, number> = {};

    flights.forEach((flight) => {
      const depAirport = AIRPORTS[flight.departure_airport];
      const arrAirport = AIRPORTS[flight.arrival_airport];

      if (!depAirport || !arrAirport) return;

      // Count airport visits
      airportCounts[flight.departure_airport] =
        (airportCounts[flight.departure_airport] || 0) + 1;
      airportCounts[flight.arrival_airport] =
        (airportCounts[flight.arrival_airport] || 0) + 1;

      // Generate great circle arc
      const arcPoints = generateGreatCircleArc(
        [depAirport.lng, depAirport.lat],
        [arrAirport.lng, arrAirport.lat]
      );

      routeFeatures.push({
        type: "Feature",
        properties: {
          flightNumber: flight.flight_number,
          departure: flight.departure_airport,
          arrival: flight.arrival_airport,
        },
        geometry: {
          type: "LineString",
          coordinates: arcPoints,
        },
      });
    });

    // Build airport features
    const airportFeatures: GeoJSON.Feature[] = Object.entries(airportCounts).map(
      ([iata, count]) => {
        const airport = AIRPORTS[iata];
        return {
          type: "Feature",
          properties: {
            iata,
            name: airport?.name || iata,
            city: airport?.city || "",
            count,
          },
          geometry: {
            type: "Point",
            coordinates: [airport?.lng || 0, airport?.lat || 0],
          },
        };
      }
    );

    // Add routes source and layer
    if (routeFeatures.length > 0) {
      map.current.addSource("routes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: routeFeatures,
        },
      });

      map.current.addLayer({
        id: "flight-routes",
        type: "line",
        source: "routes",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#FFB000",
          "line-width": 2,
          "line-opacity": 0.7,
        },
      });
    }

    // Add airports source and layers
    if (airportFeatures.length > 0) {
      map.current.addSource("airports", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: airportFeatures,
        },
      });

      // Airport dots
      map.current.addLayer({
        id: "airport-points",
        type: "circle",
        source: "airports",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 5, 10, 12],
          "circle-color": "#FFB000",
          "circle-stroke-color": "#0D0D0D",
          "circle-stroke-width": 2,
          "circle-opacity": 0.9,
        },
      });

      // Airport labels
      map.current.addLayer({
        id: "airport-labels",
        type: "symbol",
        source: "airports",
        layout: {
          "text-field": ["get", "iata"],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-size": 11,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": "#0D0D0D",
          "text-halo-width": 1,
        },
      });

      // Add popup on hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "airport-popup",
      });

      map.current.on("mouseenter", "airport-points", (e) => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = "pointer";

        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;

        const coordinates = feature.geometry.coordinates.slice() as [number, number];
        const { iata, city, count } = feature.properties as {
          iata: string;
          city: string;
          count: number;
        };

        popup
          .setLngLat(coordinates)
          .setHTML(
            `<div class="font-mono text-amber font-bold">${iata}</div>
             <div class="text-gray-300">${city}</div>
             <div class="text-gray-500 text-sm">${count} flight${count !== 1 ? "s" : ""}</div>`
          )
          .addTo(map.current);
      });

      map.current.on("mouseleave", "airport-points", () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = "";
        popup.remove();
      });
    }

    // Fit bounds to show all airports
    if (airportFeatures.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      airportFeatures.forEach((feature) => {
        if (feature.geometry.type === "Point") {
          bounds.extend(feature.geometry.coordinates as [number, number]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 5,
        duration: 1000,
      });
    }
  }, [flights, isLoaded]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-gray-800">
      <div ref={mapContainer} className="absolute inset-0" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber border-t-transparent"></div>
        </div>
      )}
      {flights.length === 0 && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center">
            <div className="text-4xl mb-2">✈️</div>
            <p className="text-gray-400">Add flights to see your routes on the map</p>
          </div>
        </div>
      )}
    </div>
  );
}
