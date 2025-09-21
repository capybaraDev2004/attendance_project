import React from 'react';
import Card, { CardTitle, CardContent } from '../../components/Card';
import { IconLayoutDashboard, IconClock, IconFaceId } from '@tabler/icons-react';

/**
 * Trang Dashboard chính cho Customer
 */
const CustomerHome = () => {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconLayoutDashboard className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                Dashboard
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Tổng quan hoạt động của bạn
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <IconClock className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chấm công hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">2 lần</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <IconFaceId className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nhận diện khuôn mặt</p>
              <p className="text-2xl font-bold text-gray-900">Hoạt động</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <IconLayoutDashboard className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Giờ làm việc</p>
              <p className="text-2xl font-bold text-gray-900">8h 30m</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <IconClock className="text-red-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Trạng thái</p>
              <p className="text-2xl font-bold text-gray-900">Đang làm việc</p>
            </div>
          </div>
        </div>
      </div>

      {/* Các hành động nhanh */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động nhanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <IconClock className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm font-medium text-gray-600">Chấm công</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <IconFaceId className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm font-medium text-gray-600">Quét khuôn mặt</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <IconLayoutDashboard className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm font-medium text-gray-600">Xem lịch sử</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;