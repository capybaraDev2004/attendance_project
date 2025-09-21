import React from 'react';
import Card, { CardTitle, CardContent } from '../../components/Card';
import { FaTools } from 'react-icons/fa';

// Placeholder cho các tab đang phát triển
const UnderConstruction = ({ title = 'TÍNH NĂNG ĐANG PHÁT TRIỂN' }) => {
  return (
    <div className="space-y-6">
      <Card>
        <div className="text-center py-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-yellow-100 rounded-full">
              <FaTools className="text-yellow-600 text-4xl" />
            </div>
          </div>
          <CardTitle level="h1" className="text-3xl font-bold text-gray-800 mb-4">
            {title}
          </CardTitle>
          <CardContent>
            <p className="text-lg text-gray-600 mb-6">
              Tính năng này đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-800">
                <strong>Cảm ơn bạn đã kiên nhẫn chờ đợi!</strong>
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default UnderConstruction;
