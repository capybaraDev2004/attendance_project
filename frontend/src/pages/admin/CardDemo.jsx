import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import Card, { CardTitle, CardContent, CardActions, CardButton } from '../../components/Card';
import { FaDesktop, FaUsers, FaHistory, FaCalculator } from 'react-icons/fa';

/**
 * Trang demo hiển thị các component Card mới
 */
const CardDemo = () => {
  return (
    <AdminLayout
      title="Demo Card Components"
      subtitle="Hiển thị các component Card với thiết kế mới"
      icon={FaDesktop}
    >
      <div className="space-y-6">
        {/* Card cơ bản */}
        <Card>
          <CardTitle level="h2" className="text-2xl mb-4">
            Default Card
          </CardTitle>
          <CardContent>
            <CardTitle level="h5" className="text-xl font-bold mb-3">
              Noteworthy technology acquisitions
            </CardTitle>
            <p className="text-gray-700">
              It is a long established fact that a reader will be distracted by
              the readable content of a page when looking at its layout. The point
              of using Lorem Ipsum is that it has a more-or-less normal
              distribution of letters, as opposed to using more-or-less normal
              distribution of letters, as opposed to using more-or-less normal
              distribution of letters
            </p>
          </CardContent>
        </Card>

        {/* Card với CTA Button */}
        <Card>
          <CardTitle level="h2" className="text-2xl mb-4">
            Card With CTA Button
          </CardTitle>
          <CardContent>
            <CardTitle level="h5" className="text-xl font-bold mb-3">
              Noteworthy technology acquisitions
            </CardTitle>
            <p className="text-gray-700 mb-4">
              Here are the biggest enterprise technology acquisitions of 2024 so far, 
              in reverse chronological order. It is a long established fact that a 
              reader will be distracted by the readable content of a page.
            </p>
            <CardActions>
              <CardButton variant="primary">
                Read more →
              </CardButton>
            </CardActions>
          </CardContent>
        </Card>

        {/* Grid Cards */}
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
                <p className="text-2xl font-bold text-gray-900">156</p>
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
                <p className="text-2xl font-bold text-gray-900">89</p>
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
                <p className="text-2xl font-bold text-gray-900">12</p>
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
                <p className="text-2xl font-bold text-gray-900">5</p>
                <span className="text-sm text-gray-500">ngày</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Card với các variant button */}
        <Card>
          <CardTitle level="h2" className="text-2xl mb-4">
            Card với các loại Button
          </CardTitle>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Demo các loại button khác nhau trong Card component
            </p>
            <CardActions className="flex-wrap gap-2">
              <CardButton variant="primary">
                Primary Button
              </CardButton>
              <CardButton variant="secondary">
                Secondary Button
              </CardButton>
              <CardButton variant="outline">
                Outline Button
              </CardButton>
            </CardActions>
          </CardContent>
        </Card>

        {/* Card có thể click */}
        <Card clickable onClick={() => alert('Card được click!')}>
          <CardTitle level="h2" className="text-2xl mb-4">
            Clickable Card
          </CardTitle>
          <CardContent>
            <p className="text-gray-700">
              Card này có thể click được. Hover để thấy hiệu ứng shadow.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CardDemo;
