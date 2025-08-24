import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import './FaceScan.css';

const FaceScan = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [errorMessage, setErrorMessage] = useState('');
  const [streamActive, setStreamActive] = useState(false);

  // Hàm tải các model nhận diện khuôn mặt
  const loadModels = async () => {
    setLoadingModels(true);
    try {
      // Đường dẫn tới các model
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      
      // Tải tuần tự các model cần thiết
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      
      setModelsLoaded(true);
      console.log("Đã tải xong các model nhận diện khuôn mặt");
    } catch (error) {
      console.error("Lỗi khi tải model:", error);
      setErrorMessage("Không thể tải model nhận diện khuôn mặt. Vui lòng thử lại sau.");
    } finally {
      setLoadingModels(false);
    }
  };

  // Khởi động camera và bắt đầu quét
  const startScan = async () => {
    setScanResult(null);
    setErrorMessage('');
    
    if (!modelsLoaded) {
      await loadModels();
    }
    
    try {
      // Truy cập camera với độ phân giải cao
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        setIsScanning(true);
        
        // Bắt đầu đếm ngược
        setCountdown(3);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              // Sau khi đếm ngược xong, bắt đầu quét
              detectFaces();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Lỗi khi truy cập camera:", error);
      setErrorMessage("Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera và thử lại.");
    }
  };

  // Dừng quét và tắt camera
  const stopScan = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
    setIsScanning(false);
  };

  // Phát hiện khuôn mặt từ video
  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Đảm bảo video đang chạy và model đã tải
    if (videoRef.current.readyState !== 4 || !modelsLoaded) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Điều chỉnh kích thước canvas phù hợp với video
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);
    
    // Phát hiện khuôn mặt
    const detections = await faceapi.detectAllFaces(
      video, 
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceExpressions();
    
    // Vẽ kết quả lên canvas
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    
    // Xử lý kết quả quét
    if (detections.length > 0) {
      // Trong trường hợp thực tế, bạn sẽ gửi dữ liệu này lên server để xác thực
      // Ở đây ta mô phỏng kết quả quét thành công
      setTimeout(() => {
        setScanResult({
          success: true,
          message: "Xác thực khuôn mặt thành công!",
          timestamp: new Date().toLocaleString()
        });
        stopScan(); // Dừng quét sau khi có kết quả
      }, 1000);
    } else {
      // Không tìm thấy khuôn mặt, tiếp tục quét
      requestAnimationFrame(detectFaces);
    }
  };

  // Clean up khi component unmount
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  return (
    <div className="face-scan-container">
      <div className="face-scan-header">
        <h1>QUÉT KHUÔN MẶT ĐIỂM DANH</h1>
        <p>Quét khuôn mặt của bạn để điểm danh nhanh chóng và chính xác</p>
      </div>

      <div className="face-scan-content">
        <div className="video-container">
          {/* Video từ camera */}
          <div className={`scanner-frame ${isScanning ? 'active' : ''}`}>
            <video 
              ref={videoRef} 
              autoPlay 
              muted
              onPlay={() => {
                if (isScanning && modelsLoaded) {
                  requestAnimationFrame(detectFaces);
                }
              }}
            />
            {/* Canvas để vẽ kết quả nhận diện */}
            <canvas ref={canvasRef} className="face-canvas" />
            
            {/* Hiệu ứng quét */}
            {isScanning && (
              <div className="scanning-overlay">
                <div className="scanning-line"></div>
                {countdown > 0 && (
                  <div className="countdown">{countdown}</div>
                )}
              </div>
            )}
          </div>

          {/* Hướng dẫn */}
          <div className="scan-instructions">
            <h3>Hướng dẫn quét khuôn mặt</h3>
            <ul>
              <li>Đảm bảo khuôn mặt của bạn đầy đủ trong khung hình</li>
              <li>Đứng trong khu vực có ánh sáng tốt</li>
              <li>Tháo kính và khẩu trang (nếu có)</li>
              <li>Nhìn thẳng vào camera</li>
            </ul>
          </div>
        </div>

        {/* Khu vực nút điều khiển */}
        <div className="scan-controls">
          {!isScanning ? (
            <button 
              className="btn-scan-face" 
              onClick={startScan}
              disabled={loadingModels}
            >
              {loadingModels ? 'Đang tải...' : 'Quét Khuôn Mặt'}
            </button>
          ) : (
            <button className="btn-stop-scan" onClick={stopScan}>
              Dừng Quét
            </button>
          )}
        </div>

        {/* Hiển thị lỗi */}
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {/* Hiển thị kết quả quét */}
        {scanResult && (
          <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
            <div className="result-icon">
              {scanResult.success ? '✅' : '❌'}
            </div>
            <div className="result-message">
              <h3>{scanResult.message}</h3>
              <p>Thời gian: {scanResult.timestamp}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceScan;
