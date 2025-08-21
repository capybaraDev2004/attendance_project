// attendance_project/frontend/src/pages/Login.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      setSuccess('Đăng nhập thành công! Vui lòng chờ một chút để chúng tôi điều hướng...');
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

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Chào mừng trở lại!</h1>
          <p className="login-subtitle">Đăng nhập để tiếp tục</p>
        </div>

        {error ? (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {success}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              <span className="label-icon">👤</span>
              Tên đăng nhập
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Nhập tên đăng nhập của bạn"
              value={form.username}
              onChange={onChange}
              required
              className="form-input"
              disabled={submitting || isRedirecting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <span className="label-icon">🔒</span>
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              value={form.password}
              onChange={onChange}
              required
              className="form-input"
              disabled={submitting || isRedirecting}
            />
          </div>

          {/* Nút "Áp dụng" để cập nhật trạng thái đăng nhập */}
          <button 
            type="submit" 
            disabled={submitting || isRedirecting} 
            className="login-button"
          >
            {submitting || isRedirecting ? (
              <span className="loading-spinner">⏳</span>
            ) : (
              <span className="button-icon"></span>
            )}
            {isRedirecting
              ? 'Đang điều hướng...'
              : (submitting ? 'Đang xử lý...' : 'Áp dụng / Đăng nhập')}
          </button>
        </form>

        <div className="demo-accounts">
          <h3 className="demo-title"> Tài khoản demo:</h3>
          <div className="account-item">
            <span className="account-role">👑 Admin:</span>
            <span className="account-details">user: <code>capybara</code> / pass: <code>123456</code></span>
          </div>
          <div className="account-item">
            <span className="account-role">👤 Customer:</span>
            <span className="account-details">user: <code>quandoggy</code> / pass: <code>123456</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;