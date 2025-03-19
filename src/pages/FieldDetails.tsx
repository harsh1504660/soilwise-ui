
import "mapbox-gl/dist/mapbox-gl.css";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Field } from '../types/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Leaf, Droplets, Sun, Thermometer, Wind, Cloud, CloudRain, MapPin } from 'lucide-react';
import { getColorForNDVI, getSoilMoistureCategory, generateHistoricalData } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import { saveFieldData, fetchWeatherData } from '@/lib/supabaseClient';
import 'mapbox-gl/dist/mapbox-gl.css';
import Map from '@/components/Map';
import * as turf from '@turf/turf';

const FieldDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ndvi');

  useEffect(() => {
    const loadFieldData = async () => {
      try {
        setLoading(true);
        const storedField = localStorage.getItem('selected_field');
        if (storedField) {
          const parsedField = JSON.parse(storedField) as Field;
          if (parsedField.id === id) {
            if (!parsedField.ndviHistory || parsedField.ndviHistory.length === 0) {
              parsedField.ndviHistory = generateHistoricalData(parsedField, 'ndvi');
            }
            if (!parsedField.soilMoistureHistory || parsedField.soilMoistureHistory.length === 0) {
              parsedField.soilMoistureHistory = generateHistoricalData(parsedField, 'soilMoisture');
            }
            
            setField(parsedField);
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

  const refreshWeatherData = async () => {
    try {
      if (!field || !field.polygon) {
        toast.error('Field data is missing');
        return;
      }
      
      const center = turf.center(field.polygon);
      const [lng, lat] = center.geometry.coordinates;
      
      toast.loading('Fetching weather data...');
      const weatherData = await fetchWeatherData(lat, lng);
      
      const updatedField: Field = {
        ...field,
        weatherData,
        lastWeatherFetch: new Date().toISOString(),
      };
      
      setField(updatedField);
      
      await saveFieldData(updatedField);
      
      toast.success('Weather data updated');
      
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast.error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{field.name}</h1>
        <Button variant="outline" onClick={() => navigate('/fields')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Fields
        </Button>
      </div>

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

        <TabsContent value="ndvi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NDVI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: "100%", minHeight: "420px", width: "100%", position: "relative" }}>
                    <Map 
                      showControls={false} 
                      displayMode="ndvi" 
                      singleField={field} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                <div className="md:col-span-2">
                  {field.weatherData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Thermometer className="h-8 w-8 mx-auto mb-2 text-red-500" />
                          <h3 className="text-lg font-semibold">Temperature</h3>
                          <p className="text-2xl font-bold">{Math.round(field.weatherData.main.temp)}°C</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 text-center">
                          <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <h3 className="text-lg font-semibold">Humidity</h3>
                          <p className="text-2xl font-bold">{field.weatherData.main.humidity}%</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 text-center">
                          <Wind className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                          <h3 className="text-lg font-semibold">Wind Speed</h3>
                          <p className="text-2xl font-bold">{Math.round(field.weatherData.wind.speed * 3.6)} km/h</p>
                        </CardContent>
                      </Card>

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

                <div className="md:col-span-1 flex flex-col items-center">
                  <div className="bg-white rounded-lg shadow overflow-hidden h-full" style={{ minHeight: "350px", width: "100%", position: "relative" }}>
                    <Map 
                      showControls={false} 
                      displayMode="default" 
                      singleField={field} 
                    />
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

        <TabsContent value="soil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Soil Moisture Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: "100%", minHeight: "420px", width: "100%", position: "relative" }}>
                    <Map 
                      showControls={false} 
                      displayMode="soil" 
                      singleField={field} 
                    />
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
