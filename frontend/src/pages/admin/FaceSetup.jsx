import React, { useEffect, useState } from 'react';

 // Cài đặt nhận diện khuôn mặt cho từng user, lưu trạng thái + ảnh vào localStorage (frontend only)
const FaceSetup = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Trạng thái đã cài đặt theo user (true/false)
  const [faceEnrollStatus, setFaceEnrollStatus] = useState({}); // key: userID, value: boolean

  // Dữ liệu ảnh đã đăng ký theo user
  // value: { imageDataUrl, fileName, uploadedAt }
  const [faceEnrollData, setFaceEnrollData] = useState({});

  // Trạng thái modal cài đặt
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [selectedUserForInstall, setSelectedUserForInstall] = useState(null);

  // Ảnh đang chọn trong modal
  const [selectedImage, setSelectedImage] = useState(null); // { fileName, dataUrl, size }
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Tải users + trạng thái đã lưu trong localStorage
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/users');
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        }
        const rawFace = localStorage.getItem('faceEnrollStatus');
        if (rawFace) setFaceEnrollStatus(JSON.parse(rawFace));

        const rawData = localStorage.getItem('faceEnrollData');
        if (rawData) setFaceEnrollData(JSON.parse(rawData));
      } catch (e) {
        console.error('Lỗi khi tải dữ liệu FaceSetup:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Xác định user đã cài đặt nhận diện chưa (ưu tiên trạng thái local)
  const isUserFaceInstalled = (user) => {
    // Gộp nhiều nguồn: localStorage + các field trên user (nếu backend có trả về)
    const fromLocalStatus = faceEnrollStatus?.[user.userID] === true;
    const fromLocalImage = Boolean(faceEnrollData?.[user.userID]?.imageDataUrl); // có ảnh đã lưu
    const fromUserFields =
      user?.face_registered === true ||
      user?.hasFaceData === true ||
      (Array.isArray(user?.face_template) && user.face_template.length > 0) ||
      user?.faceStatus === 'installed';
    return fromLocalStatus || fromLocalImage || fromUserFields || false;
  };

  const openInstallModal = (user) => {
    setSelectedUserForInstall(user);
    // Nếu đã có ảnh trước đó thì hiển thị để người dùng thấy và có thể thay thế
    const existing = faceEnrollData?.[user.userID];
    if (existing) {
      setSelectedImage({
        fileName: existing.fileName,
        dataUrl: existing.imageDataUrl,
        size: 0
      });
    } else {
      setSelectedImage(null);
    }
    setErrorMsg('');
    setInstallModalOpen(true);
  };

  const closeInstallModal = () => {
    setInstallModalOpen(false);
    setSelectedUserForInstall(null);
    setSelectedImage(null);
    setErrorMsg('');
    setSaving(false);
  };

  // Chọn ảnh từ máy - chỉ frontend, đọc base64 để lưu localStorage
  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Validate cơ bản: phải là ảnh và dung lượng < 5MB
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file ảnh hợp lệ (jpg, jpeg, png, ...).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh tối đa 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        fileName: file.name,
        dataUrl: reader.result,
        size: file.size
      });
      setErrorMsg('');
    };
    reader.onerror = () => setErrorMsg('Không thể đọc file ảnh. Vui lòng thử lại.');
    reader.readAsDataURL(file);
  };

  // Áp dụng cài đặt (đánh dấu đã cài đặt + lưu ảnh) - lưu localStorage để giữ trạng thái tạm thời
  const applyInstallForSelectedUser = () => {
    if (!selectedUserForInstall) return;

    // Bắt buộc phải chọn ảnh trước khi áp dụng
    if (!selectedImage?.dataUrl) {
      setErrorMsg('Vui lòng chọn một ảnh khuôn mặt trước khi áp dụng.');
      return;
    }

    setSaving(true);

    // Lưu trạng thái đã cài đặt
    setFaceEnrollStatus((prev) => {
      const next = { ...prev, [selectedUserForInstall.userID]: true };
      localStorage.setItem('faceEnrollStatus', JSON.stringify(next));
      return next;
    });

    // Lưu ảnh cho user
    setFaceEnrollData((prev) => {
      const next = {
        ...prev,
        [selectedUserForInstall.userID]: {
          imageDataUrl: selectedImage.dataUrl,
          fileName: selectedImage.fileName,
          uploadedAt: new Date().toISOString()
        }
      };
      localStorage.setItem('faceEnrollData', JSON.stringify(next));
      return next;
    });

    // Mô phỏng thời gian lưu để UX có cảm giác xử lý
    setTimeout(() => {
      setSaving(false);
      closeInstallModal();
    }, 400);
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">CÀI ĐẶT NHẬN DIỆN KHUÔN MẶT</h1>
      </div>

      {/* Bảng nhân viên với cột trạng thái nhận diện */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : (
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th>STT</th>
                <th>ID</th>
                <th>HỌ TÊN</th>
                <th>CHỨC VỤ</th>
                <th>VAI TRÒ</th>
                <th>TRẠNG THÁI</th>
                <th>NHẬN DIỆN KHUÔN MẶT</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#6c757d' }}>
                    Không có dữ liệu người dùng
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const installed = isUserFaceInstalled(user);
                  return (
                    <tr key={user.userID}>
                      <td>{index + 1}</td>
                      <td>{user.userID}</td>
                      <td>{user.fullName}</td>
                      <td>{user.position || '--'}</td>
                      <td>{user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</td>
                      <td>
                        <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                          {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td>
                        <div className="face-setup-cell">
                          <span className={installed ? 'face-status-installed' : 'face-status-not'}>
                            {installed ? 'ĐÃ CÀI ĐẶT' : 'CHƯA CÀI ĐẶT'}
                          </span>
                          <button className="btn-install" onClick={() => openInstallModal(user)}>Cài đặt</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal cài đặt nhận diện khuôn mặt */}
      {installModalOpen && (
        <div className="modal-overlay" onClick={closeInstallModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cài đặt nhận diện khuôn mặt</h3>
            <p>
              Xác nhận cài đặt cho: <strong>{selectedUserForInstall?.fullName}</strong>
            </p>

            {/* Khu vực chọn ảnh để lưu cho nhận diện (frontend only) */}
            <div className="upload-section" style={{ marginTop: 12 }}>
              <label className="input-label" style={{ display: 'block', marginBottom: 8 }}>Chọn ảnh khuôn mặt:</label>
              <input type="file" accept="image/*" onChange={handleImageSelect} className="form-input" />
              {errorMsg && (
                <div style={{ color: '#dc3545', marginTop: 8 }}>{errorMsg}</div>
              )}

              {/* Preview ảnh đã chọn */}
              {selectedImage?.dataUrl && (
                <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
                  <img
                    src={selectedImage.dataUrl}
                    alt="face-preview"
                    style={{
                      width: 220,
                      height: 220,
                      objectFit: 'cover',
                      borderRadius: 12,
                      border: '1px solid #e9ecef'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{selectedImage.fileName || 'Ảnh đã lưu'}</div>
                    {selectedImage.size ? (
                      <div style={{ color: '#6c757d' }}>
                        Kích thước: {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    ) : null}
                    <button
                      className="btn-cancel"
                      style={{ marginTop: 12 }}
                      onClick={() => setSelectedImage(null)}
                    >
                      Xóa ảnh đã chọn
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button
                className="btn-confirm"
                onClick={applyInstallForSelectedUser}
                disabled={saving || !selectedImage?.dataUrl}
              >
                {saving ? 'Đang lưu...' : 'Áp dụng'}
              </button>
              <button className="btn-cancel" onClick={closeInstallModal}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FaceSetup;