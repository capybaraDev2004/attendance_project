import React from 'react';

// Test component đơn giản để kiểm tra Tailwind CSS
const TailwindTest = () => {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">🧪 Tailwind CSS Test</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Button Tests:</h2>
          <div className="flex gap-4 flex-wrap">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Blue Button
            </button>
            
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Green Button
            </button>
            
            <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Red Button
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Color Tests:</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-200 p-4 rounded text-center">
              <span className="text-blue-800 font-medium">Blue</span>
            </div>
            <div className="bg-green-200 p-4 rounded text-center">
              <span className="text-green-800 font-medium">Green</span>
            </div>
            <div className="bg-red-200 p-4 rounded text-center">
              <span className="text-red-800 font-medium">Red</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Typography Tests:</h2>
          <p className="text-lg text-gray-700 mb-2">Large text</p>
          <p className="text-base text-gray-600 mb-2">Normal text</p>
          <p className="text-sm text-gray-500">Small text</p>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
        <p className="text-yellow-800">
          <strong>Kết quả:</strong> Nếu bạn thấy các button có màu sắc đẹp, background có màu, và typography đúng → Tailwind CSS đã hoạt động! 🎉
        </p>
      </div>
    </div>
  );
};

export default TailwindTest;
