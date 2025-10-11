import React, { useState, useEffect, useRef } from 'react';
import './AddCardModal.css';
import { API_ENDPOINTS } from '../config/api';

const AddCardModal = ({ isOpen, onClose, onSuccess }) => {
    const [selectedUser, setSelectedUser] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [sessionId, setSessionId] = useState(null);

    const pollTimerRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (isOpen) fetchUsers();
        // cleanup mỗi lần mở/đóng
        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.USERS);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) {
                const txt = await res.text();
                console.error('Response is not JSON:', txt.slice(0, 200));
                throw new Error('Response is not JSON');
            }
            const data = await res.json();
            if (data.success && data.users) {
                const usersWithoutCard = data.users.filter(u => !u.rfid_uid);
                setUsers(usersWithoutCard);
            }
        } catch (e) {
            console.error(e);
            setError('Không thể tải danh sách nhân viên: ' + e.message);
        }
    };

    const handleStartScanning = async () => {
        if (!selectedUser) {
            setError('Vui lòng chọn nhân viên trước khi thêm thẻ');
            return;
        }
        setLoading(true);
        setScanning(true);
        setError('');
        setMessage('Đang kết nối với thiết bị...');

        try {
            const res = await fetch(API_ENDPOINTS.CARDS.START_SCAN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser })
            });
            const data = await res.json();

            if (data?.success && data?.sessionId) {
                setSessionId(data.sessionId);
                setMessage('Mời quét thẻ RFID...');
                startPolling(data.sessionId);
            } else {
                setError(data?.message || 'Không thể kết nối với thiết bị');
                setScanning(false);
                setLoading(false);
            }
        } catch {
            setError('Lỗi kết nối với thiết bị');
            setScanning(false);
            setLoading(false);
        }
    };

    const startPolling = (sid) => {
        // clear nếu còn timer cũ
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        pollTimerRef.current = setInterval(async () => {
            try {
                const res = await fetch(API_ENDPOINTS.CARDS.SCAN_STATUS(sid));
                if (!res.ok) {
                    if (res.status === 404) {
                        // session không tồn tại/hết hạn
                        stopPolling();
                        setScanning(false);
                        setLoading(false);
                        setError('Phiên quét không tồn tại hoặc đã hết hạn.');
                    }
                    return;
                }
                const data = await res.json();

                if (data.status === 'completed') {
                    stopPolling();
                    setScanning(false);
                    setLoading(false);

                    if (data.success) {
                        setMessage('Thêm thẻ thành công!');
                        setError('');
                        setTimeout(() => {
                            onSuccess && onSuccess();
                            handleClose(true); // force close không gọi cancel
                        }, 1200);
                    } else {
                        setError(data.message || 'Lỗi khi thêm thẻ');
                    }
                } else if (data.status === 'error') {
                    stopPolling();
                    setScanning(false);
                    setLoading(false);
                    setError(data.message || 'Lỗi khi quét thẻ');
                }
            } catch (e) {
                console.error('Lỗi khi kiểm tra trạng thái quét:', e);
            }
        }, 1000);

        // timeout 30s
        timeoutRef.current = setTimeout(() => {
            stopPolling();
            if (scanning) {
                setScanning(false);
                setLoading(false);
                setError('Hết thời gian chờ quét thẻ');
            }
        }, 30000);
    };

    const stopPolling = () => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const handleCancelScan = async () => {
        if (!scanning || !sessionId) return;
        try {
            await fetch(API_ENDPOINTS.CARDS.CANCEL_SCAN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
        } catch (e) {
            console.error('Lỗi khi hủy quét thẻ:', e);
        } finally {
            stopPolling();
            setScanning(false);
            setLoading(false);
            setMessage('Đã hủy quét thẻ');
            setError('');
            setSessionId(null);
        }
    };

    const handleClose = async (force = false) => {
        if (!force && scanning) {
            await handleCancelScan();
            return;
        }
        stopPolling();
        setSelectedUser('');
        setMessage('');
        setError('');
        setSessionId(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="add-card-modal-overlay">
            <div className="add-card-modal">
                <div className="add-card-modal-header">
                    <h2>Thêm thẻ nhân viên</h2>
                    <button className="close-btn" onClick={() => handleClose()} disabled={scanning}>×</button>
                </div>

                <div className="add-card-modal-body">
                    <div className="form-group">
                        <label htmlFor="userSelect">Chọn nhân viên:</label>
                        {users.length === 0 && (
                            <div className="text-sm text-gray-500 mb-2">Không có nhân viên nào chưa có thẻ RFID</div>
                        )}
                        <select
                            id="userSelect"
                            value={selectedUser}
                            onChange={e => setSelectedUser(e.target.value)}
                            disabled={scanning}
                            className="form-select"
                        >
                            <option value="">-- Chọn nhân viên --</option>
                            {users.length > 0 ? (
                                users.map(user => (
                                    <option key={user.userID} value={user.userID}>
                                        {user.fullName} - {user.position}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>Không có nhân viên nào chưa có thẻ</option>
                            )}
                        </select>
                    </div>

                    {message && <div className={`message ${error ? 'error' : 'success'}`}>{message}</div>}
                    {error && <div className="error-message">{error}</div>}

                    {scanning && (
                        <div className="scanning-indicator">
                            <div className="spinner"></div>
                            <p>Đang chờ quét thẻ...</p>
                        </div>
                    )}
                </div>

                <div className="add-card-modal-footer">
                    {scanning ? (
                        <button type="button" className="btn btn-danger" onClick={handleCancelScan}>Hủy quét thẻ</button>
                    ) : (
                        <>
                            <button type="button" className="btn btn-secondary" onClick={() => handleClose()}>Đóng</button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleStartScanning}
                                disabled={!selectedUser || loading}
                            >
                                {loading ? 'Đang kết nối...' : 'Bắt đầu quét thẻ'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddCardModal;
