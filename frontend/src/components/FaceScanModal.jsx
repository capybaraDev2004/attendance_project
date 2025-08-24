import React, { useRef, useState, useEffect } from 'react';
import './FaceScanModal.css';
import * as faceapi from 'face-api.js';
import { toast } from 'react-toastify';

const FaceScanModal = ({ isOpen, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [scanMessage, setScanMessage] = useState('Vui lòng nhìn thẳng vào camera...');
  const [scanSuccess, setScanSuccess] = useState(false);

  // Tải model nhận diện khuôn mặt khi component mount
  useEffect(() => {
    if (isOpen && !isModelLoaded) {
      loadFaceDetectionModels();
    }
  }, [isOpen, isModelLoaded]);

  // Bắt đầu camera khi modal mở
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    // Clean up khi component unmount
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Tải các model cần thiết
  const loadFaceDetectionModels = async () => {
    setIsModelLoading(true);
    try {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      console.log("Đã tải xong model nhận diện khuôn mặt");
      setIsModelLoaded(true);
    } catch (error) {
      console.error("Lỗi khi tải model:", error);
      setScanMessage("Không thể tải model nhận diện khuôn mặt");
    } finally {
      setIsModelLoading(false);
    }
  };

  // Bắt đầu camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        // Đợi một chút để video khởi động rồi mới bắt đầu quét
        setTimeout(() => {
          if (isModelLoaded) {
            detectFaces();
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Lỗi truy cập camera:", error);
      setScanMessage("Không thể truy cập camera, vui lòng kiểm tra quyền truy cập");
    }
  };

  // Dừng camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setScanSuccess(false);
    setScanMessage('Vui lòng nhìn thẳng vào camera...');
  };

  // Phát hiện khuôn mặt
  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !overlayRef.current || !isModelLoaded) return;
    if (!isScanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    
    faceapi.matchDimensions(canvas, displaySize);
    
    try {
      const detections = await faceapi.detectAllFaces(
        video, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();
      
      // Vẽ kết quả
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      
      if (detections.length > 0) {
        // Có phát hiện khuôn mặt
        // Dùng faceapi.resizeResults nhưng không hiển thị chi tiết landmarks
        // để giữ giao diện gọn gàng
        
        // Không vẽ khung hình chữ nhật và các điểm landmark chi tiết
        // để giữ giao diện gọn gàng như trong ảnh mẫu
        
        // Thay vào đó chỉ hiển thị thông báo thành công
        setScanMessage("Đã phát hiện khuôn mặt!");
        
        // Mô phỏng xác thực thành công sau 5 giây
        setTimeout(() => {
          setScanSuccess(true);
          setScanMessage("Quét khuôn mặt hoàn tất");
          
          // Hiển thị thông báo toast ở góc phải trên cùng
          toast.success(
            <div>
              <div style={{ fontWeight: 'bold' }}>Xác thực khuôn mặt thành công!</div>
              <div>Thời gian: {new Date().toLocaleTimeString()}</div>
            </div>, 
            {
              icon: '✅',
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            }
          );
          
          // Đóng modal sau 5 giây
          setTimeout(() => {
            onClose();
          }, 5000);
        }, 5000);
        
        return; // Dừng quét khi đã phát hiện
      } else {
        // Không tìm thấy khuôn mặt, tiếp tục quét
        requestAnimationFrame(detectFaces);
      }
    } catch (error) {
      console.error("Lỗi khi phát hiện khuôn mặt:", error);
      setScanMessage("Lỗi khi nhận diện khuôn mặt");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="face-scan-modal-overlay" onClick={onClose}>
      <div className="face-scan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="face-scan-modal-header">
          <h2>Quét khuôn mặt</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="face-scan-modal-body">
          <div className="face-scan-video-container">
            {isModelLoading && <div className="loading-indicator">Đang tải...</div>}
            
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="face-scan-video"
              onPlay={() => {
                if (isModelLoaded && isScanning) {
                  detectFaces();
                }
              }}
            />
            
            {/* Khung hình bầu dục */}
            <div ref={overlayRef} className="face-scan-oval-overlay">
              <div className="face-scan-oval"></div>
              <div className={`scan-line ${isScanning ? 'scanning' : ''}`}></div>
            </div>
            
            <canvas ref={canvasRef} className="face-scan-canvas" />
            
            {scanSuccess && (
              <div className="scan-success-overlay">
                <div className="success-icon">✓</div>
              </div>
            )}
          </div>
          
          <div className="face-scan-message">
            {scanMessage}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceScanModal;