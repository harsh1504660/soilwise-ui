
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, subDays } from 'date-fns';
import { Field } from "@/types/field";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateNDVI(polygon: GeoJSON.Feature): number {
  // In a real application, this would use actual remote sensing data
  // NDVI = (NIR - Red) / (NIR + Red) where NIR is near-infrared reflectance and Red is red reflectance
  // Values range from -1 to 1, with healthy vegetation typically 0.2 to 0.8
  
  // This is a simplified simulation based on the polygon coordinates
  // Using location data to simulate different climate zones
  if (!polygon.geometry || polygon.geometry.type !== 'Polygon') return 0.5;
  
  const coordinates = polygon.geometry.coordinates[0];
  if (!coordinates || coordinates.length === 0) return 0.5;
  
  // Use coordinate variance as a factor to create variation in NDVI values
  const xCoords = coordinates.map(coord => coord[0]);
  const yCoords = coordinates.map(coord => coord[1]);
  
  const xVariance = Math.max(...xCoords) - Math.min(...xCoords);
  const yVariance = Math.max(...yCoords) - Math.min(...yCoords);
  
  // Generate a pseudo-random but consistent value based on the field's shape
  const baseValue = ((xVariance * 100) % 0.3) + 0.3; // 0.3 to 0.6 base
  const seasonalFactor = 0.1 * Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 30)); // seasonal variation
  const finalNDVI = Math.min(0.95, Math.max(0.1, baseValue + seasonalFactor));
  
  return parseFloat(finalNDVI.toFixed(2));
}

export function calculateSoilMoisture(polygon: GeoJSON.Feature): number {
  // In a real application, this would use soil sensor data or satellite-derived soil moisture indices
  // Values typically range from 0% (bone dry) to 40-50% (saturated)
  
  if (!polygon.geometry || polygon.geometry.type !== 'Polygon') return 25;
  
  const coordinates = polygon.geometry.coordinates[0];
  if (!coordinates || coordinates.length === 0) return 25;
  
  // Use coordinate average as a factor to create variation in soil moisture values
  const xAvg = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
  const yAvg = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
  
  // Generate a value between 10% and 40% based on location
  const baseValue = 10 + (((xAvg + yAvg) * 10) % 30);
  
  // Add some variation based on current time (simulating rainfall effects)
  const rainFactor = 5 * Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 15)); // periodic rainfall
  const finalMoisture = Math.min(45, Math.max(5, baseValue + rainFactor));
  
  return parseFloat(finalMoisture.toFixed(1));
}

export function generateHistoricalData(field: Field, dataType: 'ndvi' | 'soilMoisture'): any[] {
  const today = new Date();
  const result = [];
  
  // Generate 30 days of historical data
  for (let i = 30; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'MMM dd, yyyy');
    
    let value;
    if (dataType === 'ndvi') {
      // Base NDVI value for the field
      const baseValue = field.ndvi || 0.5;
      // Add some seasonal variation
      const seasonalFactor = 0.15 * Math.sin((date.getMonth() + 1) / 12 * Math.PI * 2);
      // Add some random daily variation
      const dailyVariation = (Math.random() - 0.5) * 0.05;
      value = Math.min(0.95, Math.max(0.1, baseValue + seasonalFactor + dailyVariation));
    } else {
      // Base soil moisture 
      const baseMoisture = field.soilMoisture || 25;
      // Add rainfall simulation (higher in certain periods)
      const rainfall = (date.getDate() % 7 === 0) ? 10 * Math.random() : 0;
      // Natural daily decline in moisture
      const decline = (i > 0 && result.length > 0) ? (result[result.length - 1].value * 0.05) : 0;
      value = Math.min(45, Math.max(5, baseMoisture + rainfall - decline + (Math.random() - 0.5) * 3));
    }
    
    result.push({
      date: dateStr,
      value: parseFloat(value.toFixed(2))
    });
  }
  
  return result;
}

export function getColorForNDVI(ndvi: number): string {
  if (ndvi < 0.2) return '#E5A323'; // Poor/stressed vegetation (yellow-brown)
  if (ndvi < 0.4) return '#FFDA3D'; // Fair vegetation (yellow)
  if (ndvi < 0.6) return '#77DD77'; // Good vegetation (light green)
  if (ndvi < 0.8) return '#3D9970'; // Very good vegetation (medium green)
  return '#2E8B57';                // Excellent vegetation (dark green)
}

export function getSoilMoistureCategory(moisture: number): { 
  label: string; 
  color: string;
  description: string;
} {
  if (moisture < 10) return { 
    label: 'Very Dry', 
    color: '#E74C3C',
    description: 'Severely moisture deficient. Immediate irrigation needed.'
  };
  if (moisture < 20) return { 
    label: 'Dry', 
    color: '#FF9933',
    description: 'Below optimal moisture levels. Consider irrigation soon.'
  };
  if (moisture < 30) return { 
    label: 'Adequate', 
    color: '#2ECC71',
    description: 'Moisture levels are in the optimal range for most crops.'
  };
  if (moisture < 40) return { 
    label: 'Moist', 
    color: '#3498DB',
    description: 'Good moisture levels. No irrigation needed at this time.'
  };
  return { 
    label: 'Wet', 
    color: '#1B4F72',
    description: 'High moisture content. Potential risk of over-saturation.'
  };
}
