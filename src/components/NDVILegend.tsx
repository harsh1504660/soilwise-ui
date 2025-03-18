
import React from 'react';

const NDVILegend = () => {
  return (
    <div className="absolute bottom-4 right-4 bg-white p-4 rounded-md shadow-lg z-10 max-w-xs">
      <h3 className="font-bold text-sm mb-2">NDVI Values Legend</h3>
      <div className="flex items-center space-x-1">
        <div className="h-6 w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-600 rounded"></div>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>0.0</span>
        <span>0.5</span>
        <span>1.0</span>
      </div>
      
      <div className="text-xs mt-3 text-gray-600 space-y-1">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-sm mr-2"></div>
          <p>&lt;0.2: Bare soil/Non-vegetation</p>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-sm mr-2"></div>
          <p>0.2-0.4: Sparse vegetation</p>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-600 rounded-sm mr-2"></div>
          <p>0.4-0.6: Moderate vegetation</p>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-600 rounded-sm mr-2"></div>
          <p>&gt;0.6: Dense, healthy vegetation</p>
        </div>
      </div>
      
      <div className="text-xs mt-3 pt-2 border-t border-gray-200">
        <p className="font-semibold">Real NDVI & Soil Moisture Data</p>
        <p>Based on satellite imagery from remote sensing API</p>
      </div>
    </div>
  );
};

export default NDVILegend;
