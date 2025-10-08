import React, { useEffect, useState } from 'react';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import { IconCalendarTime, IconNotes, IconClockHour4, IconClockHour8 } from '@tabler/icons-react';

const CustomerShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActiveShifts = async () => {
      setLoading(true);
      setError('');
      try {
        // API: giả định có endpoint /api/shifts (trả tất cả). Lọc client theo is_active.
        const res = await fetch('http://localhost:3001/api/shifts');
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Không tải được lịch ca');
        const rowsRaw = data.data || data.shifts || data.rows || [];
        const rows = rowsRaw.filter((s) => s.is_active === 1 || s.is_active === true);
        setShifts(rows);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveShifts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang thống nhất */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconCalendarTime className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h1" className="text-2xl font-bold text-gray-900">Lịch ca</CardTitle>
              <p className="text-gray-600 mt-1">Các ca làm đang áp dụng</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nội dung từ CSDL: bảng có màu, tag giờ bắt đầu/kết thúc rõ ràng, tránh màu tím */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="text-gray-600">Đang tải...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tên ca</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Giờ bắt đầu</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Giờ kết thúc</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shifts.map(s => (
                    <tr key={s.shift_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{s.shift_name || s.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                          <IconClockHour4 size={14} className="mr-1" /> {s.start_time}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                          <IconClockHour8 size={14} className="mr-1" /> {s.end_time}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="inline-flex items-center">
                          <IconNotes size={14} className="mr-2 text-teal-600" />
                          {s.description || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {shifts.length === 0 && (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Không có ca nào đang áp dụng.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerShifts;


