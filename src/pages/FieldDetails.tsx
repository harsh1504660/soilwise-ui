import "mapbox-gl/dist/mapbox-gl.css";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Field } from '../types/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Leaf, Droplets, Sun, Thermometer, Wind, Cloud, CloudRain, MapPin } from 'lucide-react';
import { getColorForNDVI, getSoilMoistureCategory, generateHistoricalData } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import { saveFieldData, fetchWeatherData, WEATHER_API_KEY } from '@/lib/supabaseClient';
import 'mapbox-gl/dist/mapbox-gl.css';

const FieldDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ndvi');
  
  // Map refs
  const ndviMapContainer = useRef<HTMLDivElement>(null);
  const ndviMap = useRef<mapboxgl.Map | null>(null);
  const soilMoistureMapContainer = useRef<HTMLDivElement>(null);
  const soilMoistureMap = useRef<mapboxgl.Map | null>(null);
  const weatherMapContainer = useRef<HTMLDivElement>(null);
  const weatherMap = useRef<mapboxgl.Map | null>(null);

  // Load field data effect
  useEffect(() => {
    const loadFieldData = async () => {
      try {
        setLoading(true);
        const storedField = localStorage.getItem('selected_field');
        if (storedField) {
          const parsedField = JSON.parse(storedField) as Field;
          if (parsedField.id === id) {
            // Ensure we have historical data for charts
            if (!parsedField.ndviHistory || parsedField.ndviHistory.length === 0) {
              parsedField.ndviHistory = generateHistoricalData(parsedField, 'ndvi');
            }
            if (!parsedField.soilMoistureHistory || parsedField.soilMoistureHistory.length === 0) {
              parsedField.soilMoistureHistory = generateHistoricalData(parsedField, 'soilMoisture');
            }
            
            setField(parsedField);
            // Save the updated field with historical data
            await saveFieldData(parsedField);
          }
        }
      } catch (error) {
        console.error('Error loading field data:', error);
        toast.error('Failed to load field data');
      } finally {
        setLoading(false);
      }
    };
    
    loadFieldData();
  }, [id]);

  // Initialize NDVI map when field data is available or active tab changes
  useEffect(() => {
    if (!field || !ndviMapContainer.current || activeTab !== 'ndvi') return;
    
    console.log('Initializing NDVI map with field data:', field);
    
    // Cleanup previous map instance
    if (ndviMap.current) {
      ndviMap.current.remove();
      ndviMap.current = null;
    }
    
    // Initialize NDVI map
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGFyc2gxNTA0IiwiYSI6ImNtNzV5aDBnczBzZHcycXIyYXBuMHBoaGQifQ.xKFWa2vCyHofljEE1NLRQA';
    
    try {
      ndviMap.current = new mapboxgl.Map({
        container: ndviMapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [0, 0], 
        zoom: 14,
        attributionControl: false, // Add this to hide attribution which might be causing sizing issues
      });

      ndviMap.current.on('load', () => {
        if (!ndviMap.current || !field.polygon) return;
        
        try {
          console.log('Adding NDVI polygon to map');
          
          // Add field polygon to map
          ndviMap.current.addSource('field-polygon', {
            type: 'geojson',
            data: field.polygon
          });
          
          // Add polygon layer with NDVI color
          ndviMap.current.addLayer({
            id: 'field-polygon-fill',
            type: 'fill',
            source: 'field-polygon',
            paint: {
              'fill-color': getColorForNDVI(field.ndvi || 0),
              'fill-opacity': 0.7
            }
          });
          
          // Add outline layer
          ndviMap.current.addLayer({
            id: 'field-polygon-outline',
            type: 'line',
            source: 'field-polygon',
            paint: {
              'line-color': '#ffffff',
              'line-width': 2
            }
          });
          
          // Fit map to polygon bounds
          if (field.polygon && field.polygon.geometry) {
            const bounds = turf.bbox(field.polygon);
            ndviMap.current.fitBounds([
              [bounds[0], bounds[1]],
              [bounds[2], bounds[3]]
            ], { padding: 50 });
          }
        } catch (error) {
          console.error('Error setting up NDVI map:', error);
          toast.error('Failed to load NDVI map visualization');
        }
      });

      // Force map resize after the container is fully visible
      setTimeout(() => {
        ndviMap.current?.resize();
      }, 100);
    } catch (error) {
      console.error('Failed to initialize NDVI map:', error);
      toast.error('Could not initialize NDVI map');
    }

    return () => {
      if (ndviMap.current) {
        ndviMap.current.remove();
        ndviMap.current = null;
      }
    };
  }, [field, activeTab]);

  // Initialize soil moisture map when field data is available or active tab changes
  useEffect(() => {
    if (!field || !soilMoistureMapContainer.current || activeTab !== 'soil') return;
    
    console.log('Initializing soil moisture map with field data:', field);
    
    // Cleanup previous map instance
    if (soilMoistureMap.current) {
      soilMoistureMap.current.remove();
      soilMoistureMap.current = null;
    }
    
    // Initialize soil moisture map
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGFyc2gxNTA0IiwiYSI6ImNtNzV5aDBnczBzZHcycXIyYXBuMHBoaGQifQ.xKFWa2vCyHofljEE1NLRQA';
    
    try {
      soilMoistureMap.current = new mapboxgl.Map({
        container: soilMoistureMapContainer.current,
        style: 'mapbox://styles/mapbox/light-v10',
        center: [0, 0],
        zoom: 14,
        attributionControl: false, // Add this to hide attribution which might be causing sizing issues
      });

      soilMoistureMap.current.on('load', () => {
        if (!soilMoistureMap.current || !field.polygon) return;
        
        try {
          console.log('Adding soil moisture polygon to map');
          
          // Add field polygon to map
          soilMoistureMap.current.addSource('field-polygon-moisture', {
            type: 'geojson',
            data: field.polygon
          });
          
          // Add polygon layer with soil moisture color
          const moistureCategory = getSoilMoistureCategory(field.soilMoisture || 0);
          soilMoistureMap.current.addLayer({
            id: 'field-polygon-moisture-fill',
            type: 'fill',
            source: 'field-polygon-moisture',
            paint: {
              'fill-color': moistureCategory.color,
              'fill-opacity': 0.7
            }
          });
          
          // Add outline layer
          soilMoistureMap.current.addLayer({
            id: 'field-polygon-moisture-outline',
            type: 'line',
            source: 'field-polygon-moisture',
            paint: {
              'line-color': '#000000',
              'line-width': 2
            }
          });
          
          // Fit map to polygon bounds
          if (field.polygon && field.polygon.geometry) {
            const bounds = turf.bbox(field.polygon);
            soilMoistureMap.current.fitBounds([
              [bounds[0], bounds[1]],
              [bounds[2], bounds[3]]
            ], { padding: 50 });
          }
        } catch (error) {
          console.error('Error setting up soil moisture map:', error);
          toast.error('Failed to load soil moisture map visualization');
        }
      });

      // Force map resize after the container is fully visible
      setTimeout(() => {
        soilMoistureMap.current?.resize();
      }, 100);
    } catch (error) {
      console.error('Failed to initialize soil moisture map:', error);
      toast.error('Could not initialize soil moisture map');
    }

    return () => {
      if (soilMoistureMap.current) {
        soilMoistureMap.current.remove();
        soilMoistureMap.current = null;
      }
    };
  }, [field, activeTab]);

  // Initialize weather map when field data is available or active tab changes
  useEffect(() => {
    if (!field || !weatherMapContainer.current || activeTab !== 'weather') return;
    
    console.log('Initializing weather map with field data:', field);
    
    // Cleanup previous map instance
    if (weatherMap.current) {
      weatherMap.current.remove();
      weatherMap.current = null;
    }
    
    // Initialize weather map
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGFyc2gxNTA0IiwiYSI6ImNtNzV5aDBnczBzZHcycXIyYXBuMHBoaGQifQ.xKFWa2vCyHofljEE1NLRQA';
    
    try {
      weatherMap.current = new mapboxgl.Map({
        container: weatherMapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [0, 0],
        zoom: 14,
        attributionControl: false, // Add this to hide attribution
      });

      weatherMap.current.on('load', () => {
        if (!weatherMap.current || !field.polygon) return;
        
        try {
          console.log('Adding weather data to map');
          
          // Get field center
          const center = turf.center(field.polygon);
          const coords = center.geometry.coordinates as [number, number];
          
          // Add marker at field center
          const weatherMarker = new mapboxgl.Marker({ color: '#ff6b6b' })
            .setLngLat(coords)
            .addTo(weatherMap.current!);
          
          // Add popup with weather info if available
          if (field.weatherData) {
            const temp = Math.round(field.weatherData.main.temp);
            const condition = field.weatherData.weather[0].main;
            const icon = field.weatherData.weather[0].icon;
            
            new mapboxgl.Popup({ closeButton: false })
              .setLngLat(coords)
              .setHTML(`
                <div class="p-2 text-center">
                  <img src="https://openweathermap.org/img/wn/${icon}@2x.png" width="50" alt="${condition}">
                  <div class="font-bold">${temp}°C</div>
                  <div>${condition}</div>
                </div>
              `)
              .addTo(weatherMap.current!);
          }
          
          // Fit map to polygon bounds
          if (field.polygon && field.polygon.geometry) {
            const bounds = turf.bbox(field.polygon);
            weatherMap.current.fitBounds([
              [bounds[0], bounds[1]],
              [bounds[2], bounds[3]]
            ], { padding: 100 });
          }
        } catch (error) {
          console.error('Error setting up weather map:', error);
          toast.error('Failed to load weather map visualization');
        }
      });

      // Force map resize after the container is fully visible
      setTimeout(() => {
        weatherMap.current?.resize();
      }, 100);
    } catch (error) {
      console.error('Failed to initialize weather map:', error);
      toast.error('Could not initialize weather map');
    }

    return () => {
      if (weatherMap.current) {
        weatherMap.current.remove();
        weatherMap.current = null;
      }
    };
  }, [field, activeTab, field?.weatherData]);

  // Function to refresh weather data using the hardcoded API key
  const refreshWeatherData = async () => {
    try {
      if (!field || !field.polygon) {
        toast.error('Field data is missing');
        return;
      }
      
      // Get field center coordinates for weather API
      const center = turf.center(field.polygon);
      const [lng, lat] = center.geometry.coordinates;
      
      // Fetch weather data using hardcoded API key
      const weatherData = await fetchWeatherData(lat, lng);
      
      // Update field with new weather data
      const updatedField: Field = {
        ...field,
        weatherData,
        lastWeatherFetch: new Date().toISOString(),
      };
      
      setField(updatedField);
      
      // Save updated field
      await saveFieldData(updatedField);
      
      toast.success('Weather data updated');
      
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast.error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Auto-fetch weather data if not already present
  useEffect(() => {
    const autoFetchWeather = async () => {
      if (field && field.polygon && !field.weatherData && activeTab === 'weather') {
        await refreshWeatherData();
      }
    };
    
    autoFetchWeather();
  }, [field, activeTab]);

  if (loading || !field) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">{loading ? 'Loading...' : 'Field not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header Section */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{field.name}</h1>
        <Button variant="outline" onClick={() => navigate('/fields')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Fields
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ndvi">
            <Leaf className="mr-2 h-4 w-4" /> NDVI Analysis
          </TabsTrigger>
          <TabsTrigger value="weather">
            <Sun className="mr-2 h-4 w-4" /> Weather Data
          </TabsTrigger>
          <TabsTrigger value="soil">
            <Droplets className="mr-2 h-4 w-4" /> Soil Moisture
          </TabsTrigger>
        </TabsList>

        {/* NDVI Tab Content */}
        <TabsContent value="ndvi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NDVI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NDVI Stats */}
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Current NDVI Value</h3>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {field.ndvi?.toFixed(2) || 'N/A'}
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(field.ndvi || 0) * 100}%`,
                          backgroundColor: getColorForNDVI(field.ndvi || 0)
                        }}
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {field.ndvi && field.ndvi > 0.7 ? 'Excellent vegetation health' :
                      field.ndvi && field.ndvi > 0.5 ? 'Very good vegetation health' :
                      field.ndvi && field.ndvi > 0.3 ? 'Good vegetation health' :
                      field.ndvi && field.ndvi > 0.2 ? 'Fair vegetation health' :
                      'Poor vegetation health'}
                    </div>
                  </div>

                  {/* NDVI History Chart */}
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">NDVI History</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={field.ndviHistory || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 1]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name="NDVI Value"
                            stroke="#059669" 
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* NDVI Map and Legend */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: "320px", width: "100%", position: "relative" }}>
                    <div ref={ndviMapContainer} style={{ position: "absolute", top: 0, bottom: 0, width: "100%" }} />
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-sm font-semibold mb-2">NDVI Legend</h3>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div className="text-center">
                        <div className="h-4 bg-red-500 rounded"></div>
                        <span>Poor</span>
                      </div>
                      <div className="text-center">
                        <div className="h-4 bg-yellow-500 rounded"></div>
                        <span>Fair</span>
                      </div>
                      <div className="text-center">
                        <div className="h-4 bg-green-300 rounded"></div>
                        <span>Good</span>
                      </div>
                      <div className="text-center">
                        <div className="h-4 bg-green-500 rounded"></div>
                        <span>Very Good</span>
                      </div>
                      <div className="text-center">
                        <div className="h-4 bg-green-700 rounded"></div>
                        <span>Excellent</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Tab Content */}
        <TabsContent value="weather" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Weather Analysis</span>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={refreshWeatherData}
                    disabled={loading}
                  >
                    Refresh Weather Data
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weather details */}
                <div className="md:col-span-2">
                  {field.weatherData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Temperature Card */}
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Thermometer className="h-8 w-8 mx-auto mb-2 text-red-500" />
                          <h3 className="text-lg font-semibold">Temperature</h3>
                          <p className="text-2xl font-bold">{Math.round(field.weatherData.main.temp)}°C</p>
                        </CardContent>
                      </Card>

                      {/* Humidity Card */}
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <h3 className="text-lg font-semibold">Humidity</h3>
                          <p className="text-2xl font-bold">{field.weatherData.main.humidity}%</p>
                        </CardContent>
                      </Card>

                      {/* Wind Card */}
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Wind className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                          <h3 className="text-lg font-semibold">Wind Speed</h3>
                          <p className="text-2xl font-bold">{Math.round(field.weatherData.wind.speed * 3.6)} km/h</p>
                        </CardContent>
                      </Card>

                      {/* Conditions Card */}
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Cloud className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                          <h3 className="text-lg font-semibold">Conditions</h3>
                          <div className="flex flex-col items-center">
                            {field.weatherData.weather[0].icon && (
                              <img 
                                src={`https://openweathermap.org/img/wn/${field.weatherData.weather[0].icon}@2x.png`} 
                                alt={field.weatherData.weather[0].description}
                                width="50"
                                height="50"
                              />
                            )}
                            <p className="text-xl font-bold">{field.weatherData.weather[0].main}</p>
                            <p className="text-sm text-gray-500">{field.weatherData.weather[0].description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <CloudRain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 mb-4">No weather data available</p>
                      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        Click "Refresh Weather Data" above to load the latest weather information
                      </p>
                    </div>
                  )}
                </div>

                {/* Weather map visualization - reduced size */}
                <div className="md:col-span-1 flex flex-col items-center">
                  <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: "200px", width: "100%", position: "relative" }}>
                    <div ref={weatherMapContainer} style={{ position: "absolute", top: 0, bottom: 0, width: "100%" }} />
                  </div>
                  <div className="text-sm text-center text-gray-500 mt-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Field location weather
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Soil Moisture Tab Content */}
        <TabsContent value="soil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Soil Moisture Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Soil Moisture Stats */}
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Current Soil Moisture</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {field.soilMoisture?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Status: {getSoilMoistureCategory(field.soilMoisture || 0).label}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {getSoilMoistureCategory(field.soilMoisture || 0).description}
                    </div>
                  </div>

                  {/* Soil Moisture History Chart */}
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Moisture History</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={field.soilMoistureHistory || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name="Moisture (%)"
                            stroke="#2563eb" 
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Soil Moisture Map */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: "320px", width: "100%", position: "relative" }}>
                    <div ref={soilMoistureMapContainer} style={{ position: "absolute", top: 0, bottom: 0, width: "100%" }} />
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-sm font-semibold mb-2">Soil Moisture Legend</h3>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div className="text-center">
                        <div className="h-4 rounded" style={{ backgroundColor: '#E74C3C' }}></div>
                        <span>Very Dry</span>
                      </div>
                      <div className="text-center">
                        <div className="h-4 rounded" style={{ backgroundColor: '#FF9933' }}></div>
                        <span>Dry</span>
                      </div>
                      <div className="text-center">
                        <div className="h-4 rounded" style={{ backgroundColor: '#2ECC71' }}></div>
                        <span>Optimal</span>
                      </div>
                      <div className="text-center">
                        <div className="h-4 rounded" style={{ backgroundColor: '#3498DB' }}></div>
                        <span>Moist</span>
                      </div>
                      <div className="text-center">
                        <div className="h-4 rounded" style={{ backgroundColor: '#1B4F72' }}></div>
                        <span>Wet</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FieldDetails;
