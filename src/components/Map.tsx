
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
        center: [30, 15],
        zoom: 2,
        pitch: 45,
        projection: 'globe'
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        })
      );

      // Add atmosphere and fog effects
      map.current.on('style.load', () => {
        map.current?.setFog({
          color: 'rgb(255, 255, 255)',
          'high-color': 'rgb(200, 200, 225)',
          'horizon-blend': 0.2,
        });
      });

      // Disable scroll zoom for smoother experience
      map.current.scrollZoom.disable();
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
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-primary/10 to-transparent" />
    </div>
  );
};

export default Map;
