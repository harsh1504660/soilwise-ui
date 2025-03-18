
import React from 'react';

const SoilMoistureLegend = () => {
  return (
    <div className="absolute bottom-4 right-4 bg-white p-4 rounded-md shadow-lg z-10 max-w-xs">
      <h3 className="font-bold text-sm mb-2">Soil Moisture Legend</h3>
      <div className="flex items-center space-x-1">
        <div className="h-6 w-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-600 rounded"></div>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
      
      <div className="text-xs mt-3 text-gray-600 space-y-1">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-sm mr-2"></div>
          <p>&lt;15%: Very Dry</p>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-orange-500 rounded-sm mr-2"></div>
          <p>15-30%: Dry</p>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
          <p>30-50%: Optimal</p>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
          <p>50-70%: Moist</p>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-800 rounded-sm mr-2"></div>
          <p>&gt;70%: Wet</p>
        </div>
      </div>
      
      <div className="text-xs mt-3 pt-2 border-t border-gray-200">
        <p className="font-semibold">Real Soil Moisture Data</p>
        <p className="text-xs text-gray-500">Data may be simulated if API is unavailable due to CORS limitations</p>
      </div>
    </div>
  );
};

export default SoilMoistureLegend;
