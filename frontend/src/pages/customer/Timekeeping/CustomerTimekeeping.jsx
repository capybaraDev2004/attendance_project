import React, { useState, useEffect, useCallback } from 'react';
import StandardTable from '../../../components/StandardTable';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import { IconClock, IconRefresh, IconCheck, IconAlertCircle } from '@tabler/icons-react';

// Sử dụng cùng API_URL như Login.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CustomerTimekeeping = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [actualRecordCount, setActualRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy thông tin user từ localStorage
  const getUserInfo = useCallback(() => {
    try {
      // Lấy auth object từ localStorage
      const authData = localStorage.getItem('auth');
      console.log('🔍 Raw auth data:', authData);
      
      if (authData) {
        const auth = JSON.parse(authData);
        console.log('🔍 Parsed auth data:', auth);
        
        // Trả về user info từ auth object
        if (auth.user) {
          console.log('Tìm thấy user từ auth.user:', auth.user);
          return auth.user;
        }
        
        // Nếu không có user object, thử decode token
        if (auth.token) {
          const payload = JSON.parse(atob(auth.token));
          console.log('Tìm thấy user từ token:', payload);
          return payload;
        }
      }
      
      console.warn('Không tìm thấy auth data trong localStorage');
      return null;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin user:', error);
      return null;
    }
  }, []);

  // Fetch dữ liệu lịch sử chấm công từ API
  const fetchAttendanceHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userInfo = getUserInfo();
      console.log('👤 User info:', userInfo);
      
      if (!userInfo || !userInfo.userID) {
        console.error('❌ Không có userID:', userInfo);
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      console.log('🌐 Đang gọi API với userID:', userInfo.userID);
      const apiUrl = `${API_URL}/api/attendance/user-history/${userInfo.userID}`;
      console.log('🔗 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        setError(`Lỗi API: ${response.status} - ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log('📊 API Response:', result);
      
      if (result.success) {
        setAttendanceHistory(result.data || []);
        setActualRecordCount(result.count || 0); // Sử dụng count từ API
        console.log('✅ Dữ liệu attendance:', result.data);
        console.log('📊 Số bản ghi thực tế:', result.count);
      } else {
        setError('Không thể tải dữ liệu lịch sử chấm công');
      }
    } catch (err) {
      console.error('❌ Lỗi khi fetch dữ liệu:', err);
      setError(`Có lỗi xảy ra khi tải dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [getUserInfo]);

  // Load dữ liệu khi component mount
  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

  // Format ngày theo định dạng dd/mm/yyyy
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Định nghĩa cột cho bảng
  const tableColumns = [
    {
      key: 'date',
      label: '📅 Ngày',
      visible: true,
      render: (record) => (
        <span className="font-medium">
          {record.isDateHeader ? formatDate(record.date) : formatDate(record.date)}
        </span>
      )
    },
    {
      key: 'time',
      label: '🕐 Giờ',
      visible: true,
      render: (record) => record.time
    },
    {
      key: 'type',
      label: '🏷️ Loại',
      visible: true,
      render: (record) => {
        if (record.isDateHeader) {
          return <span className="text-gray-500">📅</span>;
        }
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            record.type.toLowerCase() === 'check-in' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {record.type}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: '📊 Trạng thái',
      visible: true,
      render: (record) => {
        if (record.isDateHeader) {
          return <span></span>;
        }
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            record.status.includes('Muộn') 
              ? 'bg-red-100 text-red-800'
              : record.status.includes('Sớm')
              ? 'bg-yellow-100 text-yellow-800'
              : record.status.includes('Tăng ca')
              ? 'bg-purple-100 text-purple-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {record.status}
          </span>
        );
      }
    },
    {
      key: 'location',
      label: '📍 Địa điểm',
      visible: true,
      render: (record) => record.location
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <IconClock className="text-gray-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chấm công</h1>
              <p className="text-gray-600 mt-1">Quản lý chấm công vào/ra</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <IconClock className="text-gray-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chấm công</h1>
              <p className="text-gray-600 mt-1">Quản lý chấm công vào/ra</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <IconAlertCircle className="text-red-600 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-red-900">Có lỗi xảy ra</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex space-x-3">
            <button 
              onClick={fetchAttendanceHistory}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <IconRefresh className="mr-2" size={16} />
              Thử lại
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('auth');
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Đăng nhập lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconClock className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                Chấm công
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Quản lý chấm công vào/ra
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <IconClock className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng bản ghi</p>
              <p className="text-2xl font-bold text-gray-900">{actualRecordCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <IconCheck className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chấm công hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">
                {attendanceHistory.filter(record => 
                  record.date === new Date().toISOString().split('T')[0]
                ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <IconRefresh className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cập nhật cuối</p>
              <p className="text-sm font-bold text-gray-900">Vừa xong</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng lịch sử chấm công */}
      <StandardTable
        title="Lịch sử chấm công"
        subtitle={`Tổng: ${actualRecordCount} bản ghi`}
        icon={IconClock}
        columns={tableColumns}
        data={attendanceHistory}
        onRefresh={fetchAttendanceHistory}
        emptyState={
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <IconClock size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử chấm công</h3>
            <p className="text-gray-600">Hãy bắt đầu chấm công để xem lịch sử ở đây</p>
          </div>
        }
      />
    </div>
  );
};

export default CustomerTimekeeping;
