import React, { useEffect, useState } from 'react';
import { FaUsers, FaHistory, FaDesktop, FaCalculator } from 'react-icons/fa';
import Card, { CardTitle, CardContent, CardActions } from '../../components/Card';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';

/**
 * Trang chủ admin - hiển thị tổng quan và thống kê với thiết kế Card mới
 */
const AdminHome = () => {
  const navigate = useNavigate();

  // State thống kê
  const [activeShiftsCount, setActiveShiftsCount] = useState(0); // ca đang active
  const [todayAttendanceCount, setTodayAttendanceCount] = useState(0); // chấm công hôm nay
  const [activeDevicesCount, setActiveDevicesCount] = useState(0); // thiết bị hoạt động
  const [usersCount, setUsersCount] = useState(0); // tổng nhân viên
  const [loading, setLoading] = useState(false);

  // Gọi các API cần thiết cho dashboard và cập nhật số liệu
  useEffect(() => {
    let isMounted = true;
    // Xác định API base URL: ưu tiên env, nếu đang ở 3000 thì map sang 3001
    const computeApiBase = () => {
      const envBase = process.env.REACT_APP_API_BASE_URL;
      if (envBase) return envBase.replace(/\/$/, '');
      const origin = window.location.origin;
      if (origin.includes(':3000')) return origin.replace(':3000', ':3001');
      return origin; // trường hợp frontend được serve chung với backend
    };
    const API_BASE = computeApiBase();
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [shiftsRes, todayRes, devicesRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/api/shifts`),
          fetch(`${API_BASE}/api/attendance/today-count`),
          fetch(`${API_BASE}/api/devices`),
          fetch(`${API_BASE}/api/users`)
        ]);

        const [shiftsData, todayData, devicesData, usersData] = await Promise.all([
          shiftsRes.json(), todayRes.json(), devicesRes.json(), usersRes.json()
        ]);

        if (isMounted) {
          if (shiftsData?.success && Array.isArray(shiftsData?.data)) {
            const count = shiftsData.data.filter((s) => s.is_active === 1).length;
            setActiveShiftsCount(count);
          }
          if (todayData?.success) setTodayAttendanceCount(todayData.count || 0);
          if (devicesData?.success && Array.isArray(devicesData?.devices)) setActiveDevicesCount(devicesData.devices.length);
          if (usersData?.success && Array.isArray(usersData?.users)) setUsersCount(usersData.users.length);
        }
      } catch (err) {
        console.error('Lỗi tải số liệu dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      isMounted = false;
    };
  }, []);

  // Các handler điều hướng khi ấn nút Truy cập
  const handleGoUsers = () => navigate('/admin/users');
  const handleGoFaceSetup = () => navigate('/admin/face-setup');
  const handleGoHistory = () => navigate('/admin/history');
  const handleGoCalculate = () => navigate('/admin/calculate');
  const handleGoRfidManagement = () => navigate('/admin/rfid-management');

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
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : usersCount}</p>
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
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : todayAttendanceCount}</p>
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
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : activeDevicesCount}</p>
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
                Các ca làm việc đang áp dụng
              </CardTitle>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : activeShiftsCount}</p>
              <span className="text-sm text-gray-500">ca</span>
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
              <Button variant="primary" className="w-full" onClick={handleGoUsers}>
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
              <Button variant="primary" className="w-full" onClick={handleGoFaceSetup}>
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
              <Button variant="primary" className="w-full" onClick={handleGoHistory}>
                Truy cập
              </Button>
            </CardActions>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="text-center">
                <div className="text-4xl mb-3">💰</div>
                <CardTitle level="h3" className="text-lg mb-2">
                  Tính tổng thời làm việc
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  Tính tổng thời làm việc của nhân viên
                </p>
              </div>
            </CardContent>
            <CardActions className="justify-center">
              <Button variant="primary" className="w-full" onClick={handleGoCalculate}>
                Truy cập
              </Button>
            </CardActions>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="text-center">
                <div className="text-4xl mb-3">💳</div>
                <CardTitle level="h3" className="text-lg mb-2">
                  Quản lý thẻ RFID
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  Quản lý thẻ RFID và gán thẻ cho nhân viên
                </p>
              </div>
            </CardContent>
            <CardActions className="justify-center">
              <Button variant="primary" className="w-full" onClick={handleGoRfidManagement}>
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
