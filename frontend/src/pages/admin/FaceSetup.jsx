import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { FaUserFriends, FaCamera, FaPlus, FaEdit, FaTrash, FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './FaceSetup.css';

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
    reader.onload = (e) => {
      setSelectedImage({
        fileName: file.name,
        dataUrl: e.target.result,
        size: file.size
      });
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  // Lưu ảnh vào localStorage
  const saveFaceData = async () => {
    if (!selectedImage || !selectedUserForInstall) return;

    setSaving(true);
    try {
      // Lưu ảnh vào localStorage
      const newFaceData = {
        ...faceEnrollData,
        [selectedUserForInstall.userID]: {
          imageDataUrl: selectedImage.dataUrl,
          fileName: selectedImage.fileName,
          uploadedAt: new Date().toISOString()
        }
      };
      localStorage.setItem('faceEnrollData', JSON.stringify(newFaceData));
      setFaceEnrollData(newFaceData);

      // Cập nhật trạng thái đã cài đặt
      const newStatus = {
        ...faceEnrollStatus,
        [selectedUserForInstall.userID]: true
      };
      localStorage.setItem('faceEnrollStatus', JSON.stringify(newStatus));
      setFaceEnrollStatus(newStatus);

      closeInstallModal();
    } catch (error) {
      console.error('Lỗi khi lưu dữ liệu:', error);
      setErrorMsg('Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  // Xóa dữ liệu nhận diện
  const deleteFaceData = (userID) => {
    if (!window.confirm('Bạn có chắc muốn xóa dữ liệu nhận diện của user này?')) return;

    // Xóa ảnh
    const newFaceData = { ...faceEnrollData };
    delete newFaceData[userID];
    localStorage.setItem('faceEnrollData', JSON.stringify(newFaceData));
    setFaceEnrollData(newFaceData);

    // Xóa trạng thái
    const newStatus = { ...faceEnrollStatus };
    delete newStatus[userID];
    localStorage.setItem('faceEnrollStatus', JSON.stringify(newStatus));
    setFaceEnrollStatus(newStatus);
  };

  // Xem ảnh đã đăng ký
  const viewFaceImage = (userID) => {
    const data = faceEnrollData[userID];
    if (data?.imageDataUrl) {
      window.open(data.imageDataUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <AdminLayout
        title="Cài đặt nhận diện khuôn mặt"
        subtitle="Quản lý dữ liệu nhận diện cho từng người dùng"
        icon={FaUserFriends}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Cài đặt nhận diện khuôn mặt"
      subtitle="Quản lý dữ liệu nhận diện cho từng người dùng"
      icon={FaUserFriends}
    >
      <div className="face-setup-container">
        {/* Danh sách users */}
        <div className="users-list-container">
          <div className="users-header">
            <h3>Danh sách người dùng</h3>
            <p>Tổng cộng: {users.length} người dùng</p>
          </div>

          <div className="users-grid">
            {users.map((user) => {
              const isInstalled = isUserFaceInstalled(user);
              const hasImage = Boolean(faceEnrollData[user.userID]?.imageDataUrl);

              return (
                <div key={user.userID} className={`user-card ${isInstalled ? 'installed' : ''}`}>
                  <div className="user-avatar">
                    {hasImage ? (
                      <img 
                        src={faceEnrollData[user.userID].imageDataUrl} 
                        alt={`${user.name} face`}
                        className="face-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        <FaUserFriends />
                      </div>
                    )}

                  </div>

                  <div className="user-info">
                    <h4 className="user-name">{user.name}</h4>
                    <p className="user-email">{user.email}</p>
                    <p className="user-role">{user.role}</p>
                  </div>

                                     <div className="user-actions">
                     {isInstalled ? (
                       <>
                         <AdminButton
                           variant="outline"
                           size="small"
                           onClick={() => viewFaceImage(user.userID)}
                           title="Xem ảnh"
                           icon={FaEye}
                         />
                         <AdminButton
                           variant="primary"
                           size="small"
                           onClick={() => openInstallModal(user)}
                           title="Cập nhật ảnh"
                           icon={FaEdit}
                         />
                         <AdminButton
                           variant="danger"
                           size="small"
                           onClick={() => deleteFaceData(user.userID)}
                           title="Xóa dữ liệu"
                           icon={FaTrash}
                         />
                       </>
                     ) : (
                       <AdminButton
                         variant="primary"
                         size="small"
                         onClick={() => openInstallModal(user)}
                         title="Cài đặt nhận diện"
                         icon={FaCamera}
                       >
                         Cài đặt
                       </AdminButton>
                     )}
                   </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal cài đặt */}
        {installModalOpen && (
          <div className="modal-overlay" onClick={closeInstallModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Cài đặt nhận diện khuôn mặt</h3>
                <button className="modal-close" onClick={closeInstallModal}>×</button>
              </div>

              <div className="modal-body">
                <div className="user-info-display">
                  <h4>Người dùng: {selectedUserForInstall?.name}</h4>
                  <p>Email: {selectedUserForInstall?.email}</p>
                </div>

                <div className="image-upload-section">
                  <label htmlFor="face-image" className="upload-label">
                    <FaCamera className="upload-icon" />
                    <span>Chọn ảnh khuôn mặt</span>
                  </label>
                  <input
                    id="face-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="file-input"
                  />

                  {selectedImage && (
                    <div className="selected-image">
                      <img src={selectedImage.dataUrl} alt="Selected face" />
                      <p className="image-info">
                        {selectedImage.fileName} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}

                  {errorMsg && <p className="error-message">{errorMsg}</p>}
                </div>
              </div>

                             <div className="modal-footer">
                 <AdminButton variant="secondary" size="medium" onClick={closeInstallModal}>
                   Hủy
                 </AdminButton>
                 <AdminButton
                   variant="primary"
                   size="medium"
                   onClick={saveFaceData}
                   disabled={!selectedImage || saving}
                 >
                   {saving ? 'Đang lưu...' : 'Lưu'}
                 </AdminButton>
               </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FaceSetup;