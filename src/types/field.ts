
export interface Field {
  id: string;
  name: string;
  area: number;
  polygon: GeoJSON.Feature;
  ndvi?: number;
  ndvi_min?: number;
  ndvi_max?: number;
  created_at: string;
}
