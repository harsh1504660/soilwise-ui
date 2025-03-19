
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import * as turf from '@turf/turf';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Field } from '../types/field';
import { toast } from "sonner";
import { saveFieldData } from '@/lib/supabaseClient';
import { fetchRemoteSensingData } from '@/services/remoteSensingService';

interface MapProps {
  onFieldCreated?: (field: Omit<Field, 'id' | 'created_at' | 'lastUpdated'>) => void;
  fields?: Field[];
  onFieldUpdated?: (fieldId: string, updates: Partial<Field>) => void;
  showControls?: boolean;
  displayMode?: 'ndvi' | 'soil' | 'default';
  singleField?: Field;
}

const Map = forwardRef<{ startDrawing: () => void }, MapProps>((props, ref) => {
  const { showControls = true, displayMode = 'default', singleField } = props;
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<any>(null);
  const popups = useRef<mapboxgl.Popup[]>([]);

  useImperativeHandle(ref, () => ({
    startDrawing: () => {
      if (draw.current) {
        draw.current.changeMode('draw_polygon');
        toast.info('Draw a polygon on the map to create a field');
      }
    }
  }));

  const clearPopups = () => {
    if (popups.current.length > 0) {
      popups.current.forEach(popup => popup.remove());
      popups.current = [];
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGFyc2gxNTA0IiwiYSI6ImNtNzV5aDBnczBzZHcycXIyYXBuMHBoaGQifQ.xKFWa2vCyHofljEE1NLRQA';
    
    const mapStyle = displayMode === 'soil' 
      ? 'mapbox://styles/mapbox/light-v10' 
      : 'mapbox://styles/mapbox/satellite-v9';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [73.7586, 18.6550],
      zoom: 13,
      pitch: 0,
    });

    if (showControls) {
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl as any,
        marker: false,
        placeholder: 'Search for a location',
        zoom: 14
      });
      
      map.current.addControl(geocoder, 'top-right');
      
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        defaultMode: 'simple_select',
        styles: [
          {
            'id': 'gl-draw-polygon-fill-inactive',
            'type': 'fill',
            'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
            'paint': {
              'fill-color': '#3bb2d0',
              'fill-outline-color': '#3bb2d0',
              'fill-opacity': 0.3
            }
          },
          {
            'id': 'gl-draw-polygon-fill-active',
            'type': 'fill',
            'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            'paint': {
              'fill-color': '#ffc800',
              'fill-outline-color': '#ffc800',
              'fill-opacity': 0.5
            }
          },
          {
            'id': 'gl-draw-polygon-stroke-inactive',
            'type': 'line',
            'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#3bb2d0',
              'line-width': 2
            }
          },
          {
            'id': 'gl-draw-polygon-stroke-active',
            'type': 'line',
            'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#ffc800',
              'line-width': 3
            }
          },
          {
            'id': 'gl-draw-polygon-midpoint',
            'type': 'circle',
            'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
            'paint': {
              'circle-radius': 5,
              'circle-color': '#ffc800'
            }
          },
          {
            'id': 'gl-draw-polygon-and-line-vertex-inactive',
            'type': 'circle',
            'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
            'paint': {
              'circle-radius': 5,
              'circle-color': '#fff',
              'circle-stroke-color': '#3bb2d0',
              'circle-stroke-width': 2
            }
          },
          {
            'id': 'gl-draw-polygon-and-line-vertex-active',
            'type': 'circle',
            'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['==', 'active', 'true']],
            'paint': {
              'circle-radius': 7,
              'circle-color': '#fff',
              'circle-stroke-color': '#ffc800',
              'circle-stroke-width': 3
            }
          }
        ]
      });
  
      map.current.addControl(draw.current, 'top-left');
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
  
      map.current.on('draw.create', handleDrawCreate);
      map.current.on('draw.delete', handleDrawDelete);
      map.current.on('draw.update', handleDrawUpdate);
    } else {
      // Just add minimal controls for viewing
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    map.current.on('load', () => {
      if (map.current) {
        map.current.setPaintProperty('satellite', 'raster-opacity', 1);
      }
      
      if (singleField) {
        displaySingleField();
      } else {
        loadFields();
      }
    });

    return () => {
      clearPopups();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [displayMode, singleField, showControls]);

  const displaySingleField = () => {
    if (!map.current || !singleField || !singleField.polygon) return;
    
    // Wait for map to be fully loaded
    if (!map.current.loaded()) {
      map.current.once('load', displaySingleField);
      return;
    }
    
    // Check if source already exists and remove it to avoid duplicates
    if (map.current.getSource('single-field')) {
      if (map.current.getLayer('single-field-fill')) {
        map.current.removeLayer('single-field-fill');
      }
      if (map.current.getLayer('single-field-outline')) {
        map.current.removeLayer('single-field-outline');
      }
      map.current.removeSource('single-field');
    }
    
    // Add the field polygon to the map
    map.current.addSource('single-field', {
      type: 'geojson',
      data: singleField.polygon
    });
    
    // Different styling based on the display mode
    if (displayMode === 'ndvi') {
      const ndviValue = singleField.ndvi || 0;
      const color = getNDVIColor(ndviValue);
      
      map.current.addLayer({
        id: 'single-field-fill',
        type: 'fill',
        source: 'single-field',
        paint: {
          'fill-color': color,
          'fill-opacity': 0.7
        }
      });
    } else if (displayMode === 'soil') {
      const soilMoisture = singleField.soilMoisture || 0;
      const color = getSoilMoistureColor(soilMoisture);
      
      map.current.addLayer({
        id: 'single-field-fill',
        type: 'fill',
        source: 'single-field',
        paint: {
          'fill-color': color,
          'fill-opacity': 0.7
        }
      });
    } else {
      map.current.addLayer({
        id: 'single-field-fill',
        type: 'fill',
        source: 'single-field',
        paint: {
          'fill-color': '#3bb2d0',
          'fill-opacity': 0.5
        }
      });
    }
    
    // Add outline
    map.current.addLayer({
      id: 'single-field-outline',
      type: 'line',
      source: 'single-field',
      paint: {
        'line-color': '#ffffff',
        'line-width': 2
      }
    });
    
    // Fit map to the field bounds
    if (singleField.polygon && singleField.polygon.geometry) {
      const bounds = turf.bbox(singleField.polygon);
      map.current.fitBounds([
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]]
      ], { padding: 50 });
    }
  };
  
  // Helper function to get NDVI color based on value
  const getNDVIColor = (ndvi: number): string => {
    if (ndvi < 0.2) return '#E74C3C'; // Red
    if (ndvi < 0.4) return '#F39C12'; // Orange
    if (ndvi < 0.6) return '#F1C40F'; // Yellow
    if (ndvi < 0.8) return '#2ECC71'; // Light green
    return '#27AE60'; // Dark green
  };
  
  // Helper function to get soil moisture color based on value
  const getSoilMoistureColor = (moisture: number): string => {
    if (moisture < 15) return '#E74C3C'; // Very dry - Red
    if (moisture < 30) return '#FF9933'; // Dry - Orange
    if (moisture < 50) return '#2ECC71'; // Optimal - Green
    if (moisture < 70) return '#3498DB'; // Moist - Blue
    return '#1B4F72'; // Wet - Dark blue
  };

  useEffect(() => {
    if (map.current && map.current.loaded()) {
      if (singleField) {
        displaySingleField();
      } else {
        loadFields();
      }
    }
  }, [props.fields, singleField, displayMode]);

  const loadFields = () => {
    if (!map.current || !draw.current || !props.fields) return;
    
    clearPopups();
    
    const featureIds = draw.current.getAll().features.map((f: any) => f.id);
    if (featureIds.length > 0) {
      featureIds.forEach((id: string) => {
        draw.current.delete(id);
      });
    }
    
    if (props.fields && props.fields.length > 0) {
      console.log('Loading fields:', props.fields);
      props.fields.forEach(field => {
        try {
          if (field.polygon && field.polygon.geometry) {
            draw.current.add(field.polygon);
            
            const center = turf.center(field.polygon);
            if (center && center.geometry && center.geometry.coordinates) {
              const coordinates = center.geometry.coordinates as [number, number];
              
              const popup = new mapboxgl.Popup({ 
                closeButton: false, 
                closeOnClick: false,
                maxWidth: '250px'
              })
                .setLngLat(coordinates)
                .setHTML(`
                  <div class="p-2">
                    <h3 class="font-bold text-gray-900">${field.name}</h3>
                    <p class="text-gray-600">Area: ${field.area.toFixed(2)} m²</p>
                    ${field.ndvi ? `<p class="text-gray-600">NDVI: ${field.ndvi.toFixed(2)}</p>` : ''}
                  </div>
                `)
                .addTo(map.current!);
              
              popups.current.push(popup);
            }
          }
        } catch (error) {
          console.error('Error adding field to map:', error, field);
        }
      });
      if (props.fields.length > 0) {
        try {
          const features = props.fields.map(field => field.polygon);
          const collection = turf.featureCollection(features);
          const bounds = turf.bbox(collection);
          
          map.current.fitBounds([
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]]
          ], {
            padding: 50,
            maxZoom: 16
          });
        } catch (error) {
          console.error('Error fitting bounds:', error);
        }
      }
    }
  };

  const handleDrawCreate = async (e: any) => {
    try {
      console.log('Draw create event:', e);
      const feature = e.features[0];
      const area = turf.area(feature);
      const rounded = Math.round(area * 100) / 100;

      toast.loading('Fetching real NDVI and soil moisture data...');

      const coordinates = feature.geometry.coordinates[0].map((coord: number[]) => [coord[0], coord[1]]);
      
      let ndvi = Math.random() * (0.9 - 0.1) + 0.1;
      let soilMoisture = Math.random() * 40 + 10;
      
      const remoteSensingData = await fetchRemoteSensingData(coordinates);
      
      if (remoteSensingData) {
        ndvi = remoteSensingData.ndvi;
        soilMoisture = remoteSensingData.soil_moisture;
        toast.success('Received real NDVI and soil moisture data');
      } else {
        toast.error('Using simulated data as fallback');
      }

      if (props.onFieldCreated) {
        const newField = {
          name: `Field ${new Date().toISOString().slice(0, 10)}`,
          area: rounded,
          polygon: feature,
          ndvi: ndvi,
          soilMoisture: soilMoisture,
        };
        console.log('Creating new field with real data:', newField);
        props.onFieldCreated(newField);
      }
    } catch (error) {
      console.error('Error in handleDrawCreate:', error);
      toast.error('Failed to create field');
    }
  };

  const handleDrawDelete = (e: any) => {
    toast.info('Field deleted from map');
  };

  const handleDrawUpdate = async (e: any) => {
    try {
      const feature = e.features[0];
      const area = turf.area(feature);
      const rounded = Math.round(area * 100) / 100;
      
      toast.loading('Updating NDVI and soil moisture data...');
      
      const coordinates = feature.geometry.coordinates[0].map((coord: number[]) => [coord[0], coord[1]]);
      
      let ndvi;
      let soilMoisture;
      
      const remoteSensingData = await fetchRemoteSensingData(coordinates);
      
      if (remoteSensingData) {
        ndvi = remoteSensingData.ndvi;
        soilMoisture = remoteSensingData.soil_moisture;
        toast.success('Updated with real NDVI and soil moisture data');
      } else {
        toast.error('Field updated but unable to fetch new remote sensing data');
      }
      
      const fieldId = feature.id;
      if (props.onFieldUpdated && props.fields) {
        const field = props.fields.find(f => f.polygon.id === fieldId);
        if (field) {
          const updates: Partial<Field> = {
            area: rounded,
            polygon: feature,
            lastUpdated: new Date().toISOString()
          };
          
          if (ndvi !== undefined) updates.ndvi = ndvi;
          if (soilMoisture !== undefined) updates.soilMoisture = soilMoisture;
          
          props.onFieldUpdated(field.id, updates);
          toast.info(`Field updated: ${rounded} m²`);
        }
      } else {
        toast.info(`Field updated: ${rounded} m²`);
      }
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Failed to update field data');
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      {!map.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Loading map...</p>
        </div>
      )}
    </div>
  );
});

Map.displayName = 'Map';

export default Map;
