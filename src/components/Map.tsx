
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
  const [selectedField, setSelectedField] = useState<{
    name: string;
    ndvi?: number;
    ndvi_min?: number;
    ndvi_max?: number;
  } | null>(null);

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

  // Function to display NDVI info panel when a field is selected
  const displayFieldInfo = (field: { 
    name: string; 
    ndvi?: number; 
    ndvi_min?: number; 
    ndvi_max?: number; 
  }) => {
    setSelectedField(field);
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
          
          // Create a popup
          const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            className: 'field-popup'
          })
            .setLngLat(coordinates)
            .setHTML(`
              <div class="p-3">
                <h3 class="font-bold text-base">${field.name}</h3>
                <p>Area: ${field.area.toFixed(2)} m²</p>
                ${field.ndvi 
                  ? `<p class="font-semibold mt-2">NDVI Values:</p>
                     <div class="mt-1 space-y-1">
                       <p>Mean: <span class="font-medium">${field.ndvi.toFixed(2)}</span></p>
                       ${field.ndvi_min !== undefined ? `<p>Min: ${field.ndvi_min.toFixed(2)}</p>` : ''}
                       ${field.ndvi_max !== undefined ? `<p>Max: ${field.ndvi_max.toFixed(2)}</p>` : ''}
                     </div>
                     <div class="w-full bg-gray-200 rounded-full h-3 mt-2">
                       <div class="rounded-full h-3" 
                         style="width: ${Math.min(100, field.ndvi * 100)}%; 
                         background-color: ${getNDVIColor(field.ndvi)}">
                       </div>
                     </div>`
                  : '<p>NDVI: Calculating...</p>'}
                <button class="mt-3 py-1 px-3 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 field-info-btn" 
                  data-field-name="${field.name}" 
                  data-field-ndvi="${field.ndvi || 0}" 
                  data-field-ndvi-min="${field.ndvi_min || 0}" 
                  data-field-ndvi-max="${field.ndvi_max || 0}">
                  View NDVI Details
                </button>
              </div>
            `);
          
          popup.addTo(map.current!);
          
          // Add event listener to the button inside the popup
          const popupElement = popup.getElement();
          const button = popupElement.querySelector('.field-info-btn');
          if (button) {
            button.addEventListener('click', (e) => {
              const target = e.target as HTMLButtonElement;
              displayFieldInfo({
                name: target.getAttribute('data-field-name') || '',
                ndvi: parseFloat(target.getAttribute('data-field-ndvi') || '0'),
                ndvi_min: parseFloat(target.getAttribute('data-field-ndvi-min') || '0'),
                ndvi_max: parseFloat(target.getAttribute('data-field-ndvi-max') || '0')
              });
            });
          }
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

  // Helper function to get color based on NDVI value
  const getNDVIColor = (ndvi: number): string => {
    if (ndvi < 0.2) return '#ef4444'; // red-500
    if (ndvi < 0.4) return '#eab308'; // yellow-500
    if (ndvi < 0.6) return '#ca8a04'; // yellow-600
    return '#16a34a'; // green-600
  };

  const handleDrawCreate = async (e: any) => {
    const feature = e.features[0];
    const area = turf.area(feature);
    const rounded = Math.round(area * 100) / 100;

    toast.info('Calculating real NDVI values...');
    
    try {
      // Calculate NDVI for the created field
      const ndviData = await calculateNDVI(feature);
      
      // Update the selected field panel
      setSelectedField({
        name: `Field ${new Date().toISOString().slice(0, 10)}`,
        ndvi: ndviData.mean,
        ndvi_min: ndviData.min,
        ndvi_max: ndviData.max
      });
      
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
    setSelectedField(null);
  };

  const handleDrawUpdate = async (e: any) => {
    const feature = e.features[0];
    const area = turf.area(feature);
    const rounded = Math.round(area * 100) / 100;
    
    toast.info('Recalculating real NDVI for updated field...');
    
    try {
      const ndviData = await calculateNDVI(feature);
      setSelectedField({
        name: selectedField?.name || `Field ${new Date().toISOString().slice(0, 10)}`,
        ndvi: ndviData.mean,
        ndvi_min: ndviData.min,
        ndvi_max: ndviData.max
      });
      toast.success(`Field updated: ${rounded} m², NDVI: ${ndviData.mean.toFixed(2)}`);
    } catch (error) {
      toast.info(`Field updated: ${rounded} m²`);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* NDVI Calculation Loading Indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded shadow">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
            <span>Calculating real NDVI...</span>
          </div>
        </div>
      )}
      
      {/* Selected Field NDVI Info */}
      {selectedField && (
        <div className="absolute top-16 right-4 bg-white p-4 rounded-md shadow-lg z-10 max-w-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">{selectedField.name}</h3>
            <button 
              onClick={() => setSelectedField(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {selectedField.ndvi !== undefined ? (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">NDVI Value:</span>
                <span className="font-bold">{selectedField.ndvi.toFixed(2)}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                <div 
                  className="rounded-full h-4" 
                  style={{
                    width: `${Math.min(100, selectedField.ndvi * 100)}%`,
                    backgroundColor: getNDVIColor(selectedField.ndvi)
                  }}
                ></div>
              </div>
              
              {selectedField.ndvi_min !== undefined && selectedField.ndvi_max !== undefined && (
                <div className="flex justify-between text-sm">
                  <span>Min: {selectedField.ndvi_min.toFixed(2)}</span>
                  <span>Max: {selectedField.ndvi_max.toFixed(2)}</span>
                </div>
              )}
              
              <div className="mt-4 text-sm">
                <div className="font-medium">Health Assessment:</div>
                <div className="mt-1">
                  {selectedField.ndvi < 0.2 ? (
                    <div className="text-red-600">Poor vegetation health. Possible bare soil or stressed crops.</div>
                  ) : selectedField.ndvi < 0.4 ? (
                    <div className="text-yellow-600">Fair vegetation health. Some stress or early growth stage.</div>
                  ) : selectedField.ndvi < 0.6 ? (
                    <div className="text-yellow-700">Moderate vegetation health. Average crop development.</div>
                  ) : (
                    <div className="text-green-600">Excellent vegetation health. Dense, healthy crops.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700 mr-2"></div>
              <span>Calculating NDVI...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

Map.displayName = 'Map';

export default Map;
