
/**
 * Service to fetch real NDVI and soil moisture data from the remote sensing API
 */

import { toast } from "sonner";

const API_URL = "https://remote-sensing-app.onrender.com/get_ndvi_soil_moisture/";

/**
 * Fetches NDVI and soil moisture data for a given polygon
 * @param coordinates Array of [longitude, latitude] coordinate pairs forming a polygon
 * @returns Promise with NDVI and soil moisture values
 */
export const fetchRemoteSensingData = async (
  coordinates: [number, number][]
): Promise<{ ndvi: number; soil_moisture: number } | null> => {
  try {
    console.log("Fetching remote sensing data for coordinates:", coordinates);
    
    // Make sure the polygon is closed (first and last coordinates are the same)
    let requestCoords = [...coordinates];
    if (
      coordinates.length > 0 && 
      (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
       coordinates[0][1] !== coordinates[coordinates.length - 1][1])
    ) {
      requestCoords.push(coordinates[0]);
    }
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coords: requestCoords,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Error fetching remote sensing data:", errorData);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Remote sensing data received:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch remote sensing data:", error);
    toast.error("Failed to fetch real NDVI and soil moisture data");
    return null;
  }
};
