import React from 'react';
import './AdminButton.css';

const AdminButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
  ...props 
}) => {
  const buttonClasses = [
    'admin-btn',
    `admin-btn--${variant}`,
    `admin-btn--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon className="admin-btn__icon" />}
      {children}
    </button>
  );
};

export default AdminButton;
