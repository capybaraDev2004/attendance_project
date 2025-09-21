import React from 'react';
import { FaUsers, FaHistory, FaDesktop, FaCalculator } from 'react-icons/fa';
import Card, { CardTitle, CardContent, CardActions } from '../../components/Card';
import Button from '../../components/Button';

/**
 * Trang chủ admin - hiển thị tổng quan và thống kê với thiết kế Card mới
 */
const AdminHome = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardTitle level="h1" className="text-3xl mb-2">
          Chào mừng đến với Admin Dashboard
        </CardTitle>
        <CardContent className="text-lg">
          Quản lý hệ thống chấm công và nhân sự một cách hiệu quả
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h3" className="text-lg mb-1">
                Tổng nhân viên
              </CardTitle>
              <p className="text-2xl font-bold text-gray-900">--</p>
              <span className="text-sm text-gray-500">người</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaHistory className="text-green-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h3" className="text-lg mb-1">
                Chấm công hôm nay
              </CardTitle>
              <p className="text-2xl font-bold text-gray-900">--</p>
              <span className="text-sm text-gray-500">lần</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FaDesktop className="text-orange-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h3" className="text-lg mb-1">
                Thiết bị hoạt động
              </CardTitle>
              <p className="text-2xl font-bold text-gray-900">--</p>
              <span className="text-sm text-gray-500">thiết bị</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FaCalculator className="text-red-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h3" className="text-lg mb-1">
                Công chưa tính
              </CardTitle>
              <p className="text-2xl font-bold text-gray-900">--</p>
              <span className="text-sm text-gray-500">ngày</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardTitle level="h2" className="text-2xl mb-4">
          Các chức năng chính
        </CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="text-center">
                <div className="text-4xl mb-3">👥</div>
                <CardTitle level="h3" className="text-lg mb-2">
                  Quản lý người dùng
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  Thêm, sửa, xóa thông tin nhân viên
                </p>
              </div>
            </CardContent>
            <CardActions className="justify-center">
              <Button variant="primary" className="w-full">
                Truy cập
              </Button>
            </CardActions>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="text-center">
                <div className="text-4xl mb-3">👁</div>
                <CardTitle level="h3" className="text-lg mb-2">
                  Cài đặt nhận diện
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  Cấu hình hệ thống nhận diện khuôn mặt
                </p>
              </div>
            </CardContent>
            <CardActions className="justify-center">
              <Button variant="primary" className="w-full">
                Truy cập
              </Button>
            </CardActions>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="text-center">
                <div className="text-4xl mb-3">📜</div>
                <CardTitle level="h3" className="text-lg mb-2">
                  Lịch sử ra vào
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  Xem và quản lý lịch sử chấm công
                </p>
              </div>
            </CardContent>
            <CardActions className="justify-center">
              <Button variant="primary" className="w-full">
                Truy cập
              </Button>
            </CardActions>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="text-center">
                <div className="text-4xl mb-3">💰</div>
                <CardTitle level="h3" className="text-lg mb-2">
                  Tính công
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  Tính toán lương và công làm việc
                </p>
              </div>
            </CardContent>
            <CardActions className="justify-center">
              <Button variant="primary" className="w-full">
                Truy cập
              </Button>
            </CardActions>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default AdminHome;
