import React from 'react';

/**
 * Component Card tái sử dụng với thiết kế màu nền #f0f2f5 và card trắng
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.children - Nội dung bên trong card
 * @param {string} props.className - CSS class tùy chỉnh
 * @param {string} props.href - Link khi click vào card (optional)
 * @param {Function} props.onClick - Hàm xử lý khi click vào card (optional)
 * @param {boolean} props.clickable - Card có thể click được không
 */
export default function Card({ 
  children, 
  className = '', 
  href, 
  onClick, 
  clickable = false 
}) {
  // Xử lý click event
  const handleClick = () => {
    if (href) {
      window.location.href = href;
    } else if (onClick) {
      onClick();
    }
  };

  // Xác định class CSS cho card
  const cardClasses = `
    bg-white rounded-lg shadow-sm border border-gray-200 p-6
    ${clickable || href || onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}
    ${className}
  `.trim();

  return (
    <div 
      className={cardClasses}
      onClick={clickable || href || onClick ? handleClick : undefined}
      role={clickable || href || onClick ? 'button' : undefined}
      tabIndex={clickable || href || onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Component CardHeader cho tiêu đề card
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.children - Nội dung tiêu đề
 * @param {string} props.className - CSS class tùy chỉnh
 */
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Component CardTitle cho tiêu đề chính của card
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.children - Nội dung tiêu đề
 * @param {string} props.className - CSS class tùy chỉnh
 * @param {string} props.level - Cấp độ tiêu đề (h1, h2, h3, h4, h5, h6)
 */
export function CardTitle({ children, className = '', level = 'h5' }) {
  const baseClasses = 'text-2xl font-bold tracking-tight text-gray-900';
  const Tag = level;
  
  return (
    <Tag className={`${baseClasses} ${className}`}>
      {children}
    </Tag>
  );
}

/**
 * Component CardContent cho nội dung chính của card
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.children - Nội dung
 * @param {string} props.className - CSS class tùy chỉnh
 */
export function CardContent({ children, className = '' }) {
  return (
    <div className={`font-normal text-gray-700 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Component CardActions cho các nút hành động trong card
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.children - Nội dung actions
 * @param {string} props.className - CSS class tùy chỉnh
 */
export function CardActions({ children, className = '' }) {
  return (
    <div className={`mt-4 flex gap-2 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Component CardButton cho nút trong card
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.children - Nội dung nút
 * @param {string} props.className - CSS class tùy chỉnh
 * @param {string} props.variant - Kiểu nút (primary, secondary, outline)
 * @param {Function} props.onClick - Hàm xử lý khi click
 */
export function CardButton({ 
  children, 
  className = '', 
  variant = 'primary', 
  onClick 
}) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
