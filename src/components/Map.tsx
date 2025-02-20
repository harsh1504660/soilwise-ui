
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map only if we have a token
    const initializeMap = (token: string) => {
      if (map.current) return; // Already initialized
      
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [73.7586, 18.6550], // Coordinates from the example URL
        zoom: 19,
        pitch: 0,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Add scale control
      map.current.addControl(
        new mapboxgl.ScaleControl(),
        'bottom-right'
      );
    };

    // Prompt for Mapbox token if not available
    if (!mapboxToken) {
      const token = prompt('Please enter your Mapbox public token (you can get one from mapbox.com):');
      if (token) {
        setMapboxToken(token);
        initializeMap(token);
      }
    } else {
      initializeMap(mapboxToken);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default Map;
