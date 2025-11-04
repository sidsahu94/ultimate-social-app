// frontend/src/components/common/Spinner.jsx
import React from "react";

const Spinner = () => (
  <div className="flex items-center space-x-2">
    <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin border-blue-600"></div>
    <div className="text-sm text-gray-600">Loading...</div>
  </div>
);

export default Spinner;

