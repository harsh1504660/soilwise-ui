
export interface Field {
  id: string;
  name: string;
  area: number;
  polygon: GeoJSON.Feature;
  ndvi?: number;
  created_at: string;
  soilMoisture?: number;
  ndviHistory?: {
    date: string;
    value: number;
  }[];
  soilMoistureHistory?: {
    date: string;
    value: number;
  }[];
  lastUpdated: string;
  lastWeatherFetch?: string;
  weatherData?: {
    main: {
      temp: number;
      humidity: number;
    };
    weather: {
      main: string;
      description: string;
      icon: string;
    }[];
    wind: {
      speed: number;
    };
    coord: {
      lat: number;
      lon: number;
    };
    name?: string;
    [key: string]: any;
  };
}
