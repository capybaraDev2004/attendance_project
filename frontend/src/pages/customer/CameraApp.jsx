import React, { useRef, useState, useEffect, useCallback } from "react";
import './CameraApp.css';

export default function CameraApp() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Khởi tạo camera với chất lượng cao
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setIsCameraReady(false);
      
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Đợi video load xong
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Lỗi khởi tạo camera:", err);
      setCameraError(err.message);
      
      // Thử với cấu hình thấp hơn
      try {
        const fallbackConstraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        };
        
        const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        setStream(fallbackStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
        }
      } catch (fallbackErr) {
        setCameraError("Không thể truy cập camera. Vui lòng kiểm tra `qu`yền truy cập.");
      }
    }
  }, []);

  // Dừng camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
    setIsCameraReady(false);
    setIsProcessing(false);
  }, [stream]);

  // Chụp ảnh từ video
  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Vẽ video lên canvas
      ctx.drawImage(video, 0, 0);
      
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  }, [isCameraReady]);

  // Đóng popup camera
  const closePopup = useCallback(() => {
    stopCamera();
    setShowPopup(false);
  }, [stopCamera]);

  // Xử lý chấm công
  const handleTimekeeping = useCallback(async () => {
    if (!isCameraReady) return;
    
    setIsProcessing(true);
    
    try {
      // Chụp ảnh khuôn mặt
      const imageData = captureFrame();
      
      // Giả lập xử lý AI
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Kiểm tra chất lượng ảnh
      if (imageData) {
        // Ở đây có thể thêm logic gửi ảnh lên server để xử lý
        console.log("Đã chụp ảnh khuôn mặt:", imageData.substring(0, 100) + "...");
      }
      
      alert("Chấm công thành công! 🎉");
      closePopup();
    } catch (error) {
      console.error("Lỗi chấm công:", error);
      alert("Có lỗi xảy ra khi chấm công. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  }, [isCameraReady, captureFrame, closePopup]);

  // Mở popup camera
  const openPopup = useCallback(() => {
    setShowPopup(true);
    startCamera();
  }, [startCamera]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Xử lý phím tắt
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (showPopup) {
        if (event.key === 'Escape') {
          closePopup();
        } else if (event.key === 'Enter' && isCameraReady && !isProcessing) {
          handleTimekeeping();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showPopup, isCameraReady, isProcessing, closePopup, handleTimekeeping]);

  return (
    <div className="camera-section">
      <h3>Chấm công bằng khuôn mặt</h3>
      
      {/* Nút chấm công chính */}
      <button
        onClick={openPopup}
        className="timekeeping-btn"
        disabled={showPopup}
      >
        🕐 Chấm công ngay
      </button>

      {/* Popup camera */}
      {showPopup && (
        <div className="camera-overlay">
          <div className="camera-popup">
            {/* Header */}
            <div className="popup-header">
              <button onClick={closePopup} className="popup-close-btn">
                ✕
              </button>
            </div>
            
            {/* Nội dung */}
            <div className="popup-content">
              <div className={`video-wrapper ${!isCameraReady ? 'loading' : ''}`}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="camera-video"
                  style={{ transform: "scaleX(-1)" }}
                />
                
                {/* Canvas ẩn để chụp ảnh */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {/* Overlay khi xử lý */}
                {isProcessing && (
                  <div className="processing-overlay">
                    <div className="processing-spinner"></div>
                    <div className="processing-text">Đang xử lý chấm công...</div>
                  </div>
                )}
                
                {/* Overlay lỗi camera */}
                {cameraError && (
                  <div className="error-overlay">
                    <div className="error-icon">⚠️</div>
                    <div className="error-text">{cameraError}</div>
                    <button onClick={startCamera} className="retry-btn">
                      Thử lại
                    </button>
                  </div>
                )}
              </div>
              
              {/* Nút điều khiển */}
              <div className="popup-controls">
                <div className="control-buttons">
                  {!isProcessing ? (
                    <button 
                      onClick={handleTimekeeping} 
                      className="timekeeping-action-btn"
                      disabled={!isCameraReady || !!cameraError}
                    >
                      🕐 Chấm công ngay
                    </button>
                  ) : (
                    <div className="processing-status">
                      <div className="spinner"></div>
                      <span>Đang xác thực khuôn mặt...</span>
                    </div>
                  )}
                  
                  <button onClick={closePopup} className="cancel-btn">
                    ❌ Hủy bỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
