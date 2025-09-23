import React from 'react';
import { IconRefresh, IconEye, IconEyeOff } from '@tabler/icons-react';

/**
 * Component Table chuẩn cho toàn bộ ứng dụng
 * @param {Object} props - Các thuộc tính của component
 * @param {string} props.title - Tiêu đề bảng
 * @param {string} props.subtitle - Phụ đề bảng (optional)
 * @param {React.Component} props.icon - Icon component (optional)
 * @param {Array} props.columns - Danh sách cột với cấu trúc {key, label, visible, render}
 * @param {Array} props.data - Dữ liệu để hiển thị
 * @param {Function} props.onRefresh - Hàm xử lý khi refresh (optional)
 * @param {Function} props.onColumnToggle - Hàm xử lý khi toggle cột (optional)
 * @param {Object} props.actionButton - Nút hành động với {text, icon, onClick, variant} (optional)
 * @param {React.ReactNode} props.emptyState - Component hiển thị khi không có dữ liệu (optional)
 * @param {string} props.className - CSS class bổ sung (optional)
 */
const StandardTable = ({
  title,
  subtitle,
  icon: Icon,
  columns = [],
  data = [],
  onRefresh,
  onColumnToggle,
  actionButton,
  emptyState,
  className = ''
}) => {
  // Lọc các cột hiển thị
  const visibleColumns = columns.filter(col => col.visible !== false);
  
  // Component hiển thị khi không có dữ liệu
  const defaultEmptyState = (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        {Icon && <Icon size={48} className="mx-auto" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
      <p className="text-gray-600">Chưa có dữ liệu để hiển thị</p>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              {Icon && <Icon className="mr-2 text-green-600" size={20} />}
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                  actionButton.variant === 'primary' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {actionButton.icon && <span className="mr-2">{actionButton.icon}</span>}
                {actionButton.text}
              </button>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <IconRefresh className="mr-2" size={16} />
                Làm mới
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Column Toggle (nếu có) */}
      {onColumnToggle && columns.length > 0 && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Hiển thị cột</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {columns.map((column) => (
              <label key={column.key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={column.visible !== false}
                  onChange={() => onColumnToggle(column.key)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 flex items-center">
                  {column.visible !== false ? <IconEye size={14} className="mr-1" /> : <IconEyeOff size={14} className="mr-1" />}
                  {column.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table Content */}
      {data.length === 0 ? (
        emptyState || defaultEmptyState
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map((column) => (
                  <th 
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {visibleColumns.map((column) => (
                    <td 
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render ? column.render(row, index) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StandardTable;
