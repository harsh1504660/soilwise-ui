
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Field } from '@/types/field';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables for Supabase. Using local storage fallback.');
}

export const supabase = createClient(
  supabaseUrl || 'https://kzsaosgsmimyagtmpoer.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6c2Fvc2dzbWlteWFndG1wb2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MTA3MTMsImV4cCI6MjA1NTk4NjcxM30.m1HSN4okdgCibqENvHxUaaK2kLrtr7trHZxf-uJc1Hc'
);

// Add function to check connection
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('fields').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection error:', error);
      toast.error('Database connection failed. Using local storage.', {
        duration: 3000,
      });
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed to connect to Supabase:', e);
    toast.error('Database connection failed. Using local storage.', {
      duration: 3000,
    });
    return false;
  }
};

// Weather API key provided directly in the code as requested
export const WEATHER_API_KEY = '72dea435aebf60dda5b94b59efa8117f';

// Helper to fetch weather data
export const fetchWeatherData = async (lat: number, lng: number) => {
  try {
    const toastId = toast.loading('Fetching weather data...', {
      id: 'fetch-weather-data',
    });
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${WEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      toast.error(`Weather API error: ${errorData.message || response.statusText}`, {
        id: 'fetch-weather-data',
      });
      throw new Error(errorData.message || 'Weather API request failed');
    }
    
    const data = await response.json();
    toast.success('Weather data updated successfully', {
      id: 'fetch-weather-data',
      duration: 3000,
    });
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    toast.error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      id: 'fetch-weather-data',
      duration: 3000,
    });
    throw error;
  }
};

// Helper to save field data
export const saveFieldData = async (field: Field) => {
  try {
    console.log('Saving field data:', field);
    
    // Update lastUpdated timestamp
    const updatedField = {
      ...field,
      lastUpdated: new Date().toISOString()
    };
    
    // Always update localStorage as fallback
    const allFields = localStorage.getItem('local_fields');
    let fields = allFields ? JSON.parse(allFields) : [];
    
    // Update field in local storage
    const index = fields.findIndex((f: any) => f.id === updatedField.id);
    if (index !== -1) {
      fields[index] = updatedField;
    } else {
      fields.push(updatedField);
    }
    
    localStorage.setItem('local_fields', JSON.stringify(fields));
    localStorage.setItem('selected_field', JSON.stringify(updatedField));
    
    // Try to update in Supabase if connected
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
      const { error } = await supabase
        .from('fields')
        .upsert(updatedField);
      
      if (error) {
        console.error('Supabase update error:', error);
        toast.error('Failed to save to database. Data saved locally.', {
          duration: 3000,
        });
        return false;
      }
      
      toast.success('Field data saved successfully', {
        duration: 3000,
      });
      return true;
    }
    
    toast.success('Field data saved locally', {
      duration: 3000,
    });
    return true;
  } catch (error) {
    console.error('Error saving field data:', error);
    toast.error('Failed to save data. Please try again.', {
      duration: 3000,
    });
    return false;
  }
};
