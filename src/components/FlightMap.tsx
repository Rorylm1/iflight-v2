"use client";

console.log("[FlightMap] Module loading...");

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Flight } from "./FlightCard";
import { AIRPORTS } from "@/lib/airports";

console.log("[FlightMap] Module loaded, mapboxgl version:", mapboxgl.version);

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
  console.log("[FlightMap] Component rendering, flights:", flights.length);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    console.log("[FlightMap] Token present:", !!token);
    console.log("[FlightMap] Token starts with:", token?.substring(0, 10));

    if (!token) {
      console.error("[FlightMap] Mapbox token not found in env");
      return;
    }

    // Check container dimensions before initializing
    const rect = mapContainer.current.getBoundingClientRect();
    console.log("[FlightMap] Container dimensions:", rect.width, "x", rect.height);

    if (rect.width === 0 || rect.height === 0) {
      console.warn("[FlightMap] Container has zero dimensions, waiting...");
      // Retry after a short delay if dimensions are 0
      const retryTimeout = setTimeout(() => {
        map.current = null; // Reset so useEffect can retry
      }, 100);
      return () => clearTimeout(retryTimeout);
    }

    // Check WebGL support
    if (!mapboxgl.supported()) {
      console.error("[FlightMap] WebGL not supported");
      setMapError("WebGL is not supported in your browser. Please try a different browser.");
      return;
    }
    console.log("[FlightMap] WebGL supported:", mapboxgl.supported());

    mapboxgl.accessToken = token;

    try {
      console.log("[FlightMap] Creating map with dimensions:", rect.width, "x", rect.height);
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [0, 30],
        zoom: 1.5,
        projection: "globe",
      });

      map.current.on("load", () => {
        console.log("[FlightMap] Map loaded successfully");

        // Force resize to ensure proper rendering
        map.current?.resize();
        console.log("[FlightMap] Map resized, canvas size:",
          map.current?.getCanvas().width, "x", map.current?.getCanvas().height);

        // Add atmosphere effect for globe view
        map.current?.setFog({
          color: "rgb(13, 13, 13)",
          "high-color": "rgb(26, 26, 26)",
          "horizon-blend": 0.02,
          "space-color": "rgb(13, 13, 13)",
          "star-intensity": 0.3,
        });

        setIsLoaded(true);
      });

      map.current.on("style.load", () => {
        console.log("[FlightMap] Style loaded");
      });

      map.current.on("render", () => {
        // Only log once
        if (!map.current?.loaded()) return;
        console.log("[FlightMap] First render complete");
      });

      map.current.on("error", (e) => {
        console.error("[FlightMap] Map error:", e);
        setMapError(e.error?.message || "Map failed to load");
      });

      map.current.on("data", (e) => {
        if (e.dataType === "source" && e.isSourceLoaded) {
          console.log("[FlightMap] Source loaded:", e.sourceId);
        }
      });

      map.current.on("idle", () => {
        console.log("[FlightMap] Map idle - all tiles loaded");
      });

      map.current.on("sourcedata", (e) => {
        if (e.sourceId === "composite" && e.isSourceLoaded) {
          console.log("[FlightMap] Base map tiles loaded");
        }
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    } catch (err) {
      console.error("[FlightMap] Failed to create map:", err);
      setMapError(err instanceof Error ? err.message : "Failed to initialize map");
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add flight routes and airport markers when map is loaded and flights change
  useEffect(() => {
    console.log("[FlightMap] Route useEffect - isLoaded:", isLoaded, "flights:", flights.length);
    if (!map.current || !isLoaded) return;

    console.log("[FlightMap] Adding routes for", flights.length, "flights");

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
    let skippedFlights = 0;

    flights.forEach((flight) => {
      const depAirport = AIRPORTS[flight.departure_airport];
      const arrAirport = AIRPORTS[flight.arrival_airport];

      if (!depAirport || !arrAirport) {
        console.warn("[FlightMap] Missing airport data for:", flight.departure_airport, "->", flight.arrival_airport);
        skippedFlights++;
        return;
      }

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

    console.log("[FlightMap] Built", routeFeatures.length, "routes,", Object.keys(airportCounts).length, "airports, skipped:", skippedFlights);

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
          // luminous teal — the brand accent, brightened to read on the dark globe
          "line-color": "#2BB7A8",
          "line-width": 2,
          "line-opacity": 0.75,
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
          "circle-color": "#2BB7A8",
          "circle-stroke-color": "#0D0D0D",
          "circle-stroke-width": 2,
          "circle-opacity": 0.95,
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
            `<div style="color:#2BB7A8;font-weight:700;letter-spacing:0.04em" class="font-mono">${iata}</div>
             <div class="text-gray-200">${city}</div>
             <div class="text-gray-400 text-sm">${count} flight${count !== 1 ? "s" : ""}</div>`
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

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Show error if token is missing
  if (!token) {
    return (
      <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-line bg-pass shadow-pass flex items-center justify-center">
        <div className="text-center p-6 max-w-xs">
          <p className="text-brick font-semibold mb-2">Mapbox token not configured</p>
          <p className="text-ink-soft text-sm font-ticket">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to environment variables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-line shadow-pass">
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: "500px" }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-paper">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal border-t-transparent"></div>
        </div>
      )}
      {flights.length === 0 && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-pass border border-line rounded-xl shadow-pass px-7 py-6 text-center">
            <svg
              className="w-8 h-8 mx-auto mb-3 text-teal"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
            <p className="text-ink-soft text-sm">Add flights to see your routes on the map</p>
          </div>
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-pass border border-brick/40 rounded-xl shadow-pass px-7 py-6 text-center max-w-xs">
            <p className="text-brick font-semibold mb-2">Map error</p>
            <p className="text-ink-soft text-sm">{mapError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
