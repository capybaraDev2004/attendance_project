import React, { useEffect, useState } from 'react';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import { IconDevices2, IconMapPin, IconHash, IconCircleCheck } from '@tabler/icons-react';

const CustomerDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActiveDevices = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:3001/api/devices/active');
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Không tải được thiết bị');
        setDevices(data.devices || data.rows || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveDevices();
  }, []);

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang thống nhất */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconDevices2 className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h1" className="text-2xl font-bold text-gray-900">Thiết bị</CardTitle>
              <p className="text-gray-600 mt-1">Thiết bị được phép sử dụng</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nội dung từ CSDL: thẻ thiết bị có màu sắc rõ ràng, tránh màu tím */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="text-gray-600">Đang tải...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((d) => (
                <div
                  key={d.device_id || d.device_code}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start p-5">
                    <div className="p-2.5 bg-green-100 rounded-lg mr-3">
                      <IconCircleCheck className="text-green-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {d.device_name || d.device_code}
                        </h3>
                        <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          Hoạt động
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <IconHash size={16} className="mr-2 text-blue-600" />
                          <span>Mã thiết bị: <span className="text-gray-800 font-medium">{d.device_code}</span></span>
                        </div>
                        <div className="flex items-center">
                          <IconMapPin size={16} className="mr-2 text-teal-600" />
                          <span>Vị trí: <span className="text-gray-800 font-medium">{d.location || '—'}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {devices.length === 0 && (
                <div className="text-gray-500">Không có thiết bị hoạt động.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDevices;


