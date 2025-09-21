import React from 'react';

/**
 * Component Button tái sử dụng với Tailwind CSS
 * Hỗ trợ các màu sắc và kích thước khác nhau
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.children - Nội dung bên trong button
 * @param {string} props.variant - Màu sắc của button (primary, secondary, success, info, warning, error, light, dark)
 * @param {string} props.size - Kích thước button (xs, sm, md, lg, xl)
 * @param {Function} props.onClick - Hàm xử lý khi click
 * @param {boolean} props.disabled - Button có bị vô hiệu hóa không
 * @param {string} props.className - CSS class tùy chỉnh
 * @param {React.ReactNode} props.icon - Icon hiển thị bên cạnh text
 * @param {string} props.type - Type của button (button, submit, reset)
 * @param {boolean} props.fullWidth - Button có chiếm toàn bộ chiều rộng không
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  icon,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  // Base classes cho button
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg text-center
    transition-all duration-200 ease-in-out
    focus:ring-4 focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `.trim();

  // Variant classes
  const variantClasses = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-300',
    secondary: 'text-gray-900 bg-gray-200 hover:bg-gray-300 focus:ring-gray-300',
    success: 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-300',
    info: 'text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-300',
    warning: 'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-300',
    error: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-300',
    light: 'text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-gray-300',
    dark: 'text-white bg-gray-800 hover:bg-gray-900 focus:ring-gray-300',
    outline: 'text-gray-900 bg-transparent border border-gray-300 hover:bg-gray-100 focus:ring-gray-300'
  };

  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-base'
  };

  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${className}
  `.trim();

  // Render icon nếu có
  const renderContent = () => {
    if (icon) {
      return (
        <div className="flex items-center gap-2">
          {icon}
          {children}
        </div>
      );
    }
    return children;
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {renderContent()}
    </button>
  );
}

/**
 * Component ButtonGroup để nhóm các button lại với nhau
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.children - Các button con
 * @param {string} props.className - CSS class tùy chỉnh
 * @param {string} props.variant - Kiểu nhóm (outline, solid)
 */
export function ButtonGroup({ children, className = '', variant = 'solid' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Component ButtonToolbar để tạo toolbar với các button
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.children - Các button con
 * @param {string} props.className - CSS class tùy chỉnh
 */
export function ButtonToolbar({ children, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Component IconButton cho button chỉ có icon
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.icon - Icon hiển thị
 * @param {string} props.variant - Màu sắc của button
 * @param {string} props.size - Kích thước button
 * @param {Function} props.onClick - Hàm xử lý khi click
 * @param {boolean} props.disabled - Button có bị vô hiệu hóa không
 * @param {string} props.className - CSS class tùy chỉnh
 * @param {string} props.title - Tooltip text
 */
export function IconButton({
  icon,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  title,
  ...props
}) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 ${className}`}
      title={title}
      {...props}
    >
      {icon}
    </Button>
  );
}