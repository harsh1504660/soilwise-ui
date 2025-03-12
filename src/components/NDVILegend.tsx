
import React from 'react';

const NDVILegend = () => {
  return (
    <div className="absolute bottom-4 right-4 bg-white p-3 rounded shadow-md z-10">
      <h3 className="font-bold text-sm mb-2">NDVI Values</h3>
      <div className="flex items-center space-x-1">
        <div className="h-4 w-20 bg-gradient-to-r from-red-500 via-yellow-500 to-green-600"></div>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>0.0</span>
        <span>0.5</span>
        <span>1.0</span>
      </div>
      <div className="text-xs mt-2 text-gray-600">
        <p>&lt;0.2: Bare soil/Non-vegetation</p>
        <p>0.2-0.4: Sparse vegetation</p>
        <p>0.4-0.6: Moderate vegetation</p>
        <p>&gt;0.6: Dense, healthy vegetation</p>
      </div>
      <div className="text-xs mt-1 pt-1 border-t border-gray-200">
        <p className="font-semibold">Real NDVI Calculation</p>
        <p>Based on NIR and RED reflectance</p>
      </div>
    </div>
  );
};

export default NDVILegend;
