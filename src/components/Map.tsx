
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Field } from '../types/field';
import { toast } from "sonner";
import { calculateRealNDVI } from '../services/ndviService';

interface MapProps {
  onFieldCreated?: (field: Omit<Field, 'id' | 'created_at'>) => void;
  fields?: Field[];
}

const Map = forwardRef<{ startDrawing: () => void }, MapProps>((props, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    startDrawing: () => {
      if (draw.current) {
        draw.current.changeMode('draw_polygon');
      }
    }
  }));

  // Function to calculate NDVI based on location and polygon
  const calculateNDVI = async (polygon: GeoJSON.Feature): Promise<{min: number, max: number, mean: number}> => {
    setIsLoading(true);
    
    try {
      // Use the real NDVI calculation service
      const ndviData = await calculateRealNDVI(polygon);
      return ndviData;
    } catch (error) {
      console.error("Error calculating NDVI:", error);
      toast.error("Error calculating NDVI. Using default values.");
      return { min: 0.1, max: 0.5, mean: 0.3 };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGFyc2gxNTA0IiwiYSI6ImNtNzV5aDBnczBzZHcycXIyYXBuMHBoaGQifQ.xKFWa2vCyHofljEE1NLRQA';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [73.7586, 18.6550],
      zoom: 19,
      pitch: 0,
    });

    // Initialize draw control
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'draw_polygon'
    });

    // Add controls
    map.current.addControl(draw.current, 'top-left');
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

    // Handle draw events
    map.current.on('draw.create', handleDrawCreate);
    map.current.on('draw.delete', handleDrawDelete);
    map.current.on('draw.update', handleDrawUpdate);

    // Load existing fields if any
    map.current.on('load', () => {
      if (props.fields && props.fields.length > 0) {
        props.fields.forEach(field => {
          draw.current.add(field.polygon);
          // Add popup with field info
          const center = turf.center(field.polygon);
          const coordinates = center.geometry.coordinates as [number, number];
          const popup = new mapboxgl.Popup({ closeButton: false })
            .setLngLat(coordinates)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-bold">${field.name}</h3>
                <p>Area: ${field.area.toFixed(2)} m²</p>
                ${field.ndvi 
                  ? `<p>NDVI: ${field.ndvi.toFixed(2)}</p>
                     <div class="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                       <div class="bg-green-600 h-2.5 rounded-full" style="width: ${Math.min(100, field.ndvi * 100)}%"></div>
                     </div>`
                  : '<p>NDVI: Calculating...</p>'}
              </div>
            `);
          popup.addTo(map.current!);
        });
        toast.success(`Loaded ${props.fields.length} fields`);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [props.fields]);

  const handleDrawCreate = async (e: any) => {
    const feature = e.features[0];
    const area = turf.area(feature);
    const rounded = Math.round(area * 100) / 100;

    toast.info('Calculating real NDVI values...');
    
    try {
      // Calculate NDVI for the created field
      const ndviData = await calculateNDVI(feature);
      
      if (props.onFieldCreated) {
        props.onFieldCreated({
          name: `Field ${new Date().toISOString().slice(0, 10)}`,
          area: rounded,
          polygon: feature,
          ndvi: ndviData.mean,
          ndvi_min: ndviData.min,
          ndvi_max: ndviData.max,
        });
        toast.success('Field created with real NDVI data');
      }
    } catch (error) {
      console.error("Error in field creation:", error);
      toast.error('Failed to calculate NDVI. Using default values.');
      
      if (props.onFieldCreated) {
        props.onFieldCreated({
          name: `Field ${new Date().toISOString().slice(0, 10)}`,
          area: rounded,
          polygon: feature,
          ndvi: 0.3, // Default value
        });
      }
    }
  };

  const handleDrawDelete = (e: any) => {
    toast.info('Field deleted');
  };

  const handleDrawUpdate = async (e: any) => {
    const feature = e.features[0];
    const area = turf.area(feature);
    const rounded = Math.round(area * 100) / 100;
    
    toast.info('Recalculating real NDVI for updated field...');
    
    try {
      const ndviData = await calculateNDVI(feature);
      toast.success(`Field updated: ${rounded} m², NDVI: ${ndviData.mean.toFixed(2)}`);
    } catch (error) {
      toast.info(`Field updated: ${rounded} m²`);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      {isLoading && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded shadow">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
            <span>Calculating real NDVI...</span>
          </div>
        </div>
      )}
    </div>
  );
});

Map.displayName = 'Map';

export default Map;
