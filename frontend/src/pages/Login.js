// attendance_project/frontend/src/pages/Login.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Login.css'; // Import CSS mới

// Chú ý: API_URL có thể cấu hình qua biến môi trường REACT_APP_API_URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Thông báo đăng nhập thành công
  const [isRedirecting, setIsRedirecting] = useState(false); // Trạng thái đang chờ điều hướng
  const redirectTimerRef = useRef(null); // Giữ id timeout để cleanup

  // Dọn dẹp timeout khi unmount trang
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // Xử lý input
  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Đăng nhập và điều hướng theo role (sau 3 giây)
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      const data = await res.json();

      // Lưu auth để ProtectedRoute dùng
      localStorage.setItem('auth', JSON.stringify({
        token: data.token,
        user: data.user,
        role: data.role
      }));

      // Thông báo thành công và chờ 3 giây trước khi điều hướng
      const targetPath = data.role === 'admin' ? '/admin' : '/';
      setSuccess('Đăng nhập thành công! Đang vào trang chủ admin...');
      setIsRedirecting(true);

      // Đặt hẹn giờ 3 giây rồi điều hướng
      redirectTimerRef.current = setTimeout(() => {
        navigate(targetPath, { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      // Giải phóng trạng thái "đang gửi"; vẫn giữ isRedirecting để disable form trong lúc chờ điều hướng
      setSubmitting(false);
    }
  };

  // Animation variants cho Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="login-container">
      {/* Ảnh nền với overlay */}
      <div className="background-overlay"></div>
      
      {/* Tài khoản demo ở góc trái trên cùng */}
      <motion.div 
        className="demo-accounts-corner"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="demo-title-corner">Demo Accounts</div>
        <div className="account-item-corner">
          <span className="account-role-corner">Admin:</span>
          <span className="account-details-corner">capybara / 123456</span>
        </div>
        <div className="account-item-corner">
          <span className="account-role-corner">User:</span>
          <span className="account-details-corner">quandoggy / 123456</span>
        </div>
      </motion.div>
      
      {/* Thông báo lỗi/thành công ở góc phải trên cùng */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            className="notification-corner error"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            <span className="notification-icon">⚠️</span>
            <span className="notification-text">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div 
            className="notification-corner success"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            <span className="notification-icon">✅</span>
            <span className="notification-text">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        className="login-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="login-header"
          variants={itemVariants}
        >
          <h1 className="login-title">Chào mừng trở lại!</h1>
          <p className="login-subtitle">Đăng nhập để tiếp tục</p>
        </motion.div>

        <motion.form 
          onSubmit={onSubmit} 
          className="login-form"
          variants={itemVariants}
        >
          <motion.div 
            className="form-group"
            variants={itemVariants}
          >
            <label htmlFor="username" className="form-label">
              <span className="label-icon" data-icon="user"></span>
              Tên đăng nhập
            </label>
            <motion.input
              id="username"
              name="username"
              type="text"
              placeholder="Nhập tên đăng nhập của bạn"
              value={form.username}
              onChange={onChange}
              required
              className="form-input"
              disabled={submitting || isRedirecting}
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>

          <motion.div 
            className="form-group"
            variants={itemVariants}
          >
            <label htmlFor="password" className="form-label">
              <span className="label-icon" data-icon="lock"></span>
              Mật khẩu
            </label>
            <motion.input
              id="password"
              name="password"
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              value={form.password}
              onChange={onChange}
              required
              className="form-input"
              disabled={submitting || isRedirecting}
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>

          {/* Nút đăng nhập */}
          <motion.button 
            type="submit" 
            disabled={submitting || isRedirecting} 
            className="login-button"
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {submitting || isRedirecting ? (
              <motion.span 
                className="loading-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                ⏳
              </motion.span>
            ) : (
              <span className="button-icon"></span>
            )}
            {isRedirecting
              ? 'Đang điều hướng...'
              : (submitting ? 'Đang xử lý...' : 'Đăng nhập')}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default LoginPage;