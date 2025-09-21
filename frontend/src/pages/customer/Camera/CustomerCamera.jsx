import React from 'react';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import { IconCamera, IconClock, IconCheck } from '@tabler/icons-react';

/**
 * Trang Camera cho chấm công bằng camera
 */
const CustomerCamera = () => {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconCamera className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                Camera
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Chấm công bằng camera
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin trạng thái */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <IconCamera className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Camera sẵn sàng</h3>
              <p className="text-gray-600">Hệ thống camera đã được kích hoạt</p>
            </div>
          </div>
          <div className="text-sm text-green-600 font-medium">
            <IconCheck className="inline mr-1" size={16} />
            Hoạt động
          </div>
        </div>
      </div>

      {/* Khu vực camera */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera view */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Camera View</h3>
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <IconCamera className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-500">Camera sẽ hiển thị ở đây</p>
              <p className="text-sm text-gray-400 mt-1">Đang kết nối...</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="mt-4 flex space-x-3">
            <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              <IconClock className="inline mr-2" size={16} />
              Chấm công vào
            </button>
            <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              <IconClock className="inline mr-2" size={16} />
              Chấm công ra
            </button>
          </div>
        </div>

        {/* Thông tin chấm công */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chấm công</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Thời gian vào:</span>
              <span className="font-medium text-gray-900">08:30 AM</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Thời gian ra:</span>
              <span className="font-medium text-gray-900">Chưa chấm công</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Tổng giờ làm:</span>
              <span className="font-medium text-green-600">6h 45m</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Trạng thái:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Đang làm việc
              </span>
            </div>
          </div>

          {/* Lịch sử gần đây */}
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Lịch sử gần đây</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Hôm nay</span>
                <span className="text-gray-900">08:30 - 17:15</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Hôm qua</span>
                <span className="text-gray-900">08:45 - 17:30</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Thứ 2</span>
                <span className="text-gray-900">08:20 - 17:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hướng dẫn sử dụng */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-blue-900 mb-2">Hướng dẫn sử dụng</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Đảm bảo camera được kết nối và hoạt động bình thường</li>
          <li>• Đứng trước camera và nhấn nút "Chấm công vào" khi bắt đầu làm việc</li>
          <li>• Nhấn nút "Chấm công ra" khi kết thúc công việc</li>
          <li>• Hệ thống sẽ tự động ghi nhận thời gian chấm công</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomerCamera;
