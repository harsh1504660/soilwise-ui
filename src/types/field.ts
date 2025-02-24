
export interface Field {
  id: string;
  name: string;
  area: number;
  polygon: GeoJSON.Feature;
  ndvi?: number;
  created_at: string;
}
