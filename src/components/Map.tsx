
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Field } from '../types/field';

interface MapProps {
  onFieldCreated?: (field: Omit<Field, 'id' | 'created_at'>) => void;
  fields?: Field[];
}

const Map = forwardRef<{ startDrawing: () => void }, MapProps>((props, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    startDrawing: () => {
      if (draw.current) {
        draw.current.changeMode('draw_polygon');
      }
    }
  }));

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
    if (props.fields) {
      map.current.on('load', () => {
        props.fields?.forEach(field => {
          draw.current.add(field.polygon);
        });
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [props.fields]);

  const handleDrawCreate = (e: any) => {
    const feature = e.features[0];
    const area = turf.area(feature);
    const rounded = Math.round(area * 100) / 100;

    if (props.onFieldCreated) {
      props.onFieldCreated({
        name: `Field ${new Date().toISOString().slice(0, 10)}`,
        area: rounded,
        polygon: feature,
      });
    }
  };

  const handleDrawDelete = (e: any) => {
    console.log('Field deleted:', e.features);
  };

  const handleDrawUpdate = (e: any) => {
    const feature = e.features[0];
    const area = turf.area(feature);
    const rounded = Math.round(area * 100) / 100;
    console.log('Field updated:', rounded, 'square meters');
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
});

Map.displayName = 'Map';

export default Map;
