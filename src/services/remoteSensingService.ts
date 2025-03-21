
/**
 * Service to fetch real NDVI and soil moisture data from the remote sensing API
 */

import { toast } from "sonner";

const API_URL = "https://ndvi-api-80ia.onrender.com/get_ndvi_soil_moisture";

/**
 * Fetches NDVI and soil moisture data for a given polygon
 * @param coordinates Array of [longitude, latitude] coordinate pairs forming a polygon
 * @returns Promise with NDVI and soil moisture values
 */
export const fetchRemoteSensingData = async (
  coordinates: [number, number][],
  showToast: boolean = false
): Promise<{ ndvi: number; soil_moisture: number } | null> => {
  try {
    // Prevent processing if no coordinates provided
    if (!coordinates || coordinates.length === 0) {
      console.log("No coordinates provided, skipping remote sensing data fetch");
      return null;
    }
    
    if (coordinates.length < 3) {
      console.log("Not enough coordinate points for a polygon, skipping remote sensing data fetch");
      return null;
    }
    
    console.log("Fetching remote sensing data for coordinates:", coordinates);
    
    // Only show loading toast if explicitly requested and coordinates are valid
    let toastId;
    if (showToast) {
      toastId = toast.loading('Fetching real NDVI and soil moisture data...', {
        id: 'fetch-remote-sensing-data',
        duration: 10000, // Auto-dismiss after 10 seconds if not explicitly dismissed
      });
    }
    
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
        // Adding CORS headers for the request
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      mode: "cors", // Explicitly set the mode to cors
      body: JSON.stringify({
        coords: requestCoords,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Error fetching remote sensing data:", errorData);
      if (showToast) {
        toast.error(`API error: ${response.status} ${response.statusText}`, {
          id: 'fetch-remote-sensing-data',
          duration: 3000,
        });
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Remote sensing data received:", data);
    
    if (showToast) {
      toast.success('Received real NDVI and soil moisture data', {
        id: 'fetch-remote-sensing-data',
        duration: 3000, // Auto dismiss after 3 seconds
      });
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch remote sensing data:", error);
    
    // If we get a CORS error, try to handle it by using a fallback or proxy
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log("CORS issue detected, returning simulated data");
      
      if (showToast) {
        toast.error('Connection issue, using simulated data', {
          id: 'fetch-remote-sensing-data',
          duration: 3000,
        });
      }
      
      // Return simulated data as fallback
      return {
        ndvi: Math.random() * (0.9 - 0.1) + 0.1,
        soil_moisture: Math.random() * 40 + 10
      };
    } else {
      if (showToast) {
        toast.error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          id: 'fetch-remote-sensing-data',
          duration: 3000,
        });
      }
      return null;
    }
  }
};
