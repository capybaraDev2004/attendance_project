import React from 'react';

/**
 * Layout chính cho Customer Dashboard với màu nền #f0f2f5
 * @param {Object} props - Các thuộc tính của component
 * @param {string} props.title - Tiêu đề trang
 * @param {string} props.subtitle - Phụ đề trang (optional)
 * @param {React.Component} props.icon - Icon component (optional)
 * @param {React.ReactNode} props.children - Nội dung trang
 * @param {React.ReactNode} props.headerActions - Các nút hành động ở header (optional)
 */
const CustomerLayout = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  headerActions 
}) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {Icon && <Icon className="text-gray-600" size={24} />}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
              </div>
            </div>
            
            {headerActions && (
              <div className="flex items-center space-x-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CustomerLayout;
