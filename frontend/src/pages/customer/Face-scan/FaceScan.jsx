import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  const [currentStream, setCurrentStream] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref ổn định để tránh stale-closure
  const isScanningRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const currentStreamRef = useRef(null);
  useEffect(() => { isScanningRef.current = isScanning; }, [isScanning]);
  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  useEffect(() => { currentStreamRef.current = currentStream; }, [currentStream]);

  const detectionAbortRef = useRef(false);
  const scanTimeoutRef = useRef(null);
  const backendFallbackTriedRef = useRef(false); // đánh dấu đã fallback backend một lần
  
  // THÊM LOCK MECHANISM ĐỂ TRÁNH GỌI API NHIỀU LẦN
  const apiCallLockRef = useRef(false);
  const lastApiCallTimeRef = useRef(0);
  const API_DEBOUNCE_MS = 2000; // Chặn gọi API trong 2 giây

  // Helper: luôn lấy instance face-api từ window (UMD) để tránh trộn phiên bản TFJS
  const getFA = () => (typeof window !== 'undefined' ? window.faceapi : undefined);

  // Cấu hình mặc định cho TinyFaceDetector
  const TINY_INPUT_SIZE = 512;
  const TINY_THRESHOLD = 0.35;
  // Xóa biến DETECT_STRATEGIES không sử dụng để loại bỏ warning

  // Nạp model với nhiều phương án URL (ưu tiên public/models, có preflight kiểm tra manifest JSON)
  const loadModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      // Đảm bảo đã nạp UMD face-api.js để đồng bộ TFJS, tránh lỗi fromPixels/engine
      if (typeof window !== 'undefined' && !window.faceapi) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = '/models/face-api.js-master/dist/face-api.min.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Không thể nạp face-api.min.js'));
          document.body.appendChild(script);
        });
      }

      const fa = getFA();
      if (!fa) throw new Error('face-api chưa sẵn sàng');
      // Danh sách candidate URL để tải models (đặt /models lên đầu để tránh gọi nhầm dev server 3000)
      // 1) /models (thư mục public của frontend)
      // 2) REACT_APP_API_BASE (nếu có) + /api/face_api/weights (backend)
      // 3) Cùng domain hiện tại + /api/face_api/weights (khi frontend build chung backend)
      const envBase = process.env.REACT_APP_API_BASE?.trim();
      const originBase = typeof window !== 'undefined' ? window.location.origin : '';
      
      const candidates = [
        envBase ? `${envBase}/api/face_api/weights` : null,
        `${originBase}/api/face_api/weights`,
        '/models'
      ].filter(Boolean);

      let lastError = null;

      // File manifest để preflight
      const manifest = 'tiny_face_detector_model-weights_manifest.json';

      // Thử lần lượt từng nguồn cho tới khi thành công, có preflight xác thực JSON
      for (const MODEL_URL of candidates) {
        try {
          // Thiết lập backend CPU mặc định để tránh lỗi fromPixels/engine của WebGL
          try {
            if (fa?.tf?.setBackend) {
              await fa.tf.setBackend('cpu');
              await fa.tf.ready();
              console.log('Đang dùng TFJS backend:', fa?.tf?.getBackend?.());
            }
          } catch (be) {
            console.warn('Không thể thiết lập backend cpu:', be?.message || be);
          }

          // Preflight: đảm bảo endpoint thực sự phục vụ JSON manifest
          try {
            const resp = await fetch(`${MODEL_URL}/${manifest}`, { method: 'GET' });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const ct = resp.headers.get('content-type') || '';
            if (!ct.includes('application/json')) throw new Error(`Invalid content-type: ${ct}`);
            await resp.json(); // xác thực JSON hợp lệ
          } catch (preErr) {
            // Bỏ qua nguồn nếu preflight không đạt
            console.warn('Bỏ qua nguồn model do preflight thất bại:', MODEL_URL, preErr?.message || preErr);
            continue;
          }

          await Promise.all([
            fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            fa.nets.ssdMobilenetv1?.loadFromUri(MODEL_URL)
          ]);
          setModelsLoaded(true);
          console.log('Đã tải xong các model nhận diện khuôn mặt từ:', MODEL_URL);
          setErrorMessage('');
          lastError = null;
          break;
        } catch (e) {
          // Ghi nhận lỗi và thử nguồn kế tiếp
          lastError = e;
          console.warn('Tải model thất bại từ', MODEL_URL, e?.message || e);
        }
      }

      if (!modelsLoaded && lastError) {
        throw lastError;
      }
    } catch (error) {
      console.error('Lỗi khi tải model:', error);
      // Thông báo thân thiện cho người dùng
      setErrorMessage('Không thể tải model nhận diện khuôn mặt. Vui lòng thử lại sau.');
      setModelsLoaded(false);
    } finally {
      setLoadingModels(false);
    }
  }, [modelsLoaded]);

  // Lấy userID hiện tại từ authentication state
  const getCurrentUserId = () => {
    try {
      console.log('🔍 Đang lấy userID từ authentication state...');
      
      // Thử các cách lấy userID từ localStorage theo thứ tự ưu tiên
      const authKeys = ['auth', 'user', 'currentUser', 'userInfo'];
      
      for (const key of authKeys) {
        const rawData = localStorage.getItem(key);
        if (rawData) {
          try {
            const data = JSON.parse(rawData);
            console.log(`📋 Dữ liệu từ ${key}:`, data);
            
            // Thử các cấu trúc khác nhau
            const possiblePaths = [
              data?.user?.userID,
              data?.user?.userId, 
              data?.user?.id,
              data?.data?.userID,
              data?.data?.userId,
              data?.data?.id,
              data?.profile?.userID,
              data?.profile?.userId,
              data?.profile?.id,
              data?.userID,
              data?.userId,
              data?.id
            ];
            
            for (const userId of possiblePaths) {
              if (userId !== undefined && userId !== null && userId !== '') {
                console.log(`✅ Tìm thấy userID: ${userId} từ ${key}`);
                return userId;
              }
            }
          } catch (parseErr) {
            console.warn(`⚠️ Không thể parse dữ liệu từ ${key}:`, parseErr);
          }
        }
      }
      
      // Thử lấy từ các key riêng lẻ
      const directKeys = ['userID', 'userId', 'currentUserId'];
      for (const key of directKeys) {
        const value = localStorage.getItem(key);
        if (value && value !== 'null' && value !== 'undefined') {
          console.log(`✅ Tìm thấy userID: ${value} từ key trực tiếp ${key}`);
          return value;
        }
      }
      
      console.warn('⚠️ Không tìm thấy userID trong localStorage');
      return null;
    } catch (error) {
      console.error('❌ Lỗi khi lấy userID:', error);
      return null;
    }
  };

  // Lấy token đăng nhập nếu có để gửi Authorization cho backend
  const getAuthToken = () => {
    try {
      const rawAuth = localStorage.getItem('auth');
      if (rawAuth) {
        try {
          const a = JSON.parse(rawAuth);
          const t = a?.token || a?.accessToken || a?.data?.token || a?.data?.accessToken;
          if (t) return t;
        } catch (_) {}
      }
      const t1 = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (t1) return t1;
    } catch (_) {}
    return null;
  };

  // TẮT CAMERA hoàn toàn (dùng ref → tham chiếu ổn định)
  const stopCameraCompletely = useCallback(() => {
    detectionAbortRef.current = true;

    // Hủy timer timeout nếu đang chạy
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    const s = currentStreamRef.current;
    if (s) {
      s.getTracks().forEach(t => t.stop());
      currentStreamRef.current = null;
      setCurrentStream(null);
    }

    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
    setCountdown(3);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    console.log('Đã tắt hoàn toàn camera');
  }, []);

  const stopScan = useCallback(() => {
    stopCameraCompletely();
  }, [stopCameraCompletely]);

  // Gọi API backend để so khớp đúng user hiện tại + lưu chấm công - THÊM LOCK MECHANISM
  const submitDescriptor = useCallback(async (descriptor, userID) => {
    // KIỂM TRA LOCK ĐỂ TRÁNH GỌI API NHIỀU LẦN
    const now = Date.now();
    if (apiCallLockRef.current || (now - lastApiCallTimeRef.current) < API_DEBOUNCE_MS) {
      console.log('🚫 BỎ QUA: API đang được gọi hoặc chưa đủ thời gian debounce');
      return;
    }

    // SET LOCK NGAY LẬP TỨC
    apiCallLockRef.current = true;
    lastApiCallTimeRef.current = now;

    try {
      setIsSubmitting(true);

      // Chuẩn bị danh sách base URL gọi API theo thứ tự ưu tiên
      const envBase = process.env.REACT_APP_API_BASE?.trim();
      const apiBases = [
        envBase || null,
        'http://127.0.0.1:3001',
        'http://localhost:3001'
      ].filter(Boolean);

      // Sử dụng userID được truyền vào thay vì lấy lại
      console.log('📤 Gửi descriptor cho userID:', userID);
      let lastErr = null;

      for (const base of apiBases) {
        try {
          // Bỏ qua dev server :3000 nếu không có proxy cho /api
          if (base.includes(':3000')) {
            // vẫn thử, nhưng ưu tiên sau cùng (đã đặt cuối danh sách)
          }

          const token = getAuthToken();
          const res = await fetch(`${base}/api/face/attendance/current`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ descriptor, userID: userID })
          });

          // Đọc text trước để debug tốt hơn khi không phải JSON
          const text = await res.text();
          let data;
          try { data = text ? JSON.parse(text) : {}; } catch (_) { data = {}; }

          if (!res.ok || !data.success) {
            // Nếu template bị khóa (403) hoặc hệ thống bị vô hiệu hóa, hiển thị thông điệp rõ ràng
            const friendly = (res.status === 403)
              ? (data.message || 'Tài khoản nhận diện của bạn đã bị khóa, chi tiết vui lòng liên hệ phòng kĩ thuật!')
              : (data.message || `HTTP ${res.status}: ${res.statusText}`);
            throw new Error(friendly);
          }

          setScanResult({
            success: true,
            message: data.message || 'Xác thực khuôn mặt thành công!',
            timestamp: new Date().toLocaleString()
          });
          stopScan();
          return; // Thành công → thoát hàm
        } catch (e) {
          lastErr = e;
          console.warn('Gọi API attendance thất bại tại', base, e?.message || e);
          continue; // Thử base tiếp theo
        }
      }

      // Nếu tất cả base đều thất bại
      throw lastErr || new Error('Không thể kết nối API chấm công');
    } catch (err) {
      console.error('Lỗi submitDescriptor:', err);
      setScanResult({
        success: false,
        message: err.message || 'Không thể chấm công bằng khuôn mặt',
        timestamp: new Date().toLocaleString()
      });
      stopScan();
    } finally {
      setIsSubmitting(false);
      // GIẢI PHÓNG LOCK SAU KHI HOÀN THÀNH
      apiCallLockRef.current = false;
    }
  }, [stopScan]);

  // Chụp 1 khung hình từ video và mã hóa thành vector 128 - THÊM KIỂM TRA LOCK
  const captureAndDetectOnce = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isScanningRef.current || !modelsLoaded) return;
    if (detectionAbortRef.current) return;
    
    // KIỂM TRA LOCK ĐỂ TRÁNH DETECT NHIỀU LẦN
    if (apiCallLockRef.current || isSubmittingRef.current) {
      console.log('🚫 BỎ QUA: Đang xử lý API hoặc đang submit');
      return;
    }

    try {
      const fa = getFA();
      if (!fa) return;
      const video = videoRef.current;
      
      // CẢI THIỆN: Kiểm tra camera sẵn sàng chi tiết hơn
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 3) {
        console.log('⚠️ Camera chưa sẵn sàng:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState
        });
        return;
      }

      // Hàm detect Tiny với fallback backend khi gặp lỗi fromPixels/engine
      const detectTiny = async (source, opts) => {
        try {
          return await fa
            .detectSingleFace(source, new fa.TinyFaceDetectorOptions({ inputSize: opts?.inputSize ?? TINY_INPUT_SIZE, scoreThreshold: opts?.threshold ?? TINY_THRESHOLD }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        } catch (err) {
          const msg = String(err?.message || err || '');
          const stack = String(err?.stack || '');
          // Nếu lỗi liên quan engine.ts/fromPixels trên WebGL → chuyển sang CPU và thử lại 1 lần
          if (!backendFallbackTriedRef.current && (msg.includes('is not a function') || stack.includes('engine.ts') || stack.includes('fromPixels'))) {
            try {
              backendFallbackTriedRef.current = true;
              if (fa?.tf?.setBackend) {
                await fa.tf.setBackend('cpu');
                await fa.tf.ready();
                console.warn('Fallback TFJS backend sang CPU do lỗi fromPixels/engine');
              }
              return await fa
                .detectSingleFace(source, new fa.TinyFaceDetectorOptions({ inputSize: opts?.inputSize ?? TINY_INPUT_SIZE, scoreThreshold: opts?.threshold ?? TINY_THRESHOLD }))
                .withFaceLandmarks()
                .withFaceDescriptor();
            } catch (e2) {
              throw e2;
            }
          }
          throw err;
        }
      };

      // Hàm detect SSD (fallback khi Tiny thất bại) với cùng cơ chế fallback backend
      const detectSSD = async (source, opts) => {
        if (!fa.nets?.ssdMobilenetv1?.params) return null; // chưa tải được SSD
        try {
          // Thử single trước
          let single = await fa
            .detectSingleFace(source, new fa.SsdMobilenetv1Options({ minConfidence: opts?.minConfidence ?? 0.3, maxResults: 1 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
          if (single) return single;
          // Nếu chưa có, thử all faces rồi chọn box lớn nhất
          const list = await fa
            .detectAllFaces(source, new fa.SsdMobilenetv1Options({ minConfidence: opts?.minConfidence ?? 0.3, maxResults: 5 }))
            .withFaceLandmarks()
            .withFaceDescriptors();
          if (list && list.length) {
            list.sort((a, b) => (b.detection.box.width * b.detection.box.height) - (a.detection.box.width * a.detection.box.height));
            return list[0];
          }
          return null;
        } catch (err) {
          const msg = String(err?.message || err || '');
          const stack = String(err?.stack || '');
          if (!backendFallbackTriedRef.current && (msg.includes('is not a function') || stack.includes('engine.ts') || stack.includes('fromPixels'))) {
            try {
              backendFallbackTriedRef.current = true;
              if (fa?.tf?.setBackend) {
                await fa.tf.setBackend('cpu');
                await fa.tf.ready();
                console.warn('Fallback TFJS backend sang CPU do lỗi fromPixels/engine (SSD)');
              }
              let single = await fa
                .detectSingleFace(source, new fa.SsdMobilenetv1Options({ minConfidence: opts?.minConfidence ?? 0.3, maxResults: 1 }))
                .withFaceLandmarks()
                .withFaceDescriptor();
              if (single) return single;
              const list = await fa
                .detectAllFaces(source, new fa.SsdMobilenetv1Options({ minConfidence: opts?.minConfidence ?? 0.3, maxResults: 5 }))
                .withFaceLandmarks()
                .withFaceDescriptors();
              if (list && list.length) {
                list.sort((a, b) => (b.detection.box.width * b.detection.box.height) - (a.detection.box.width * a.detection.box.height));
                return list[0];
              }
              return null;
            } catch (e2) {
              throw e2;
            }
          }
          throw err;
        }
      };

      // Luôn chụp khung hình video sang canvas offscreen để thống nhất nguồn ảnh cho fromPixels
      const off = document.createElement('canvas');
      off.width = video.videoWidth;
      off.height = video.videoHeight;
      const offCtx = off.getContext('2d');
      offCtx.drawImage(video, 0, 0, off.width, off.height);

      // CẢI THIỆN: Thêm fallback detection với nhiều strategy hơn VÀ GIẢM THRESHOLD
      const DETECT_STRATEGIES_IMPROVED = [
        { engine: 'tiny', inputSize: 320, threshold: 0.15 }, // GIẢM threshold để tăng độ nhạy
        { engine: 'tiny', inputSize: 416, threshold: 0.12 },
        { engine: 'tiny', inputSize: 512, threshold: 0.10 },
        { engine: 'tiny', inputSize: 608, threshold: 0.08 },
        { engine: 'tiny', inputSize: 224, threshold: 0.20 }, // THÊM strategy mới
        { engine: 'ssd', minConfidence: 0.15 },
        { engine: 'ssd', minConfidence: 0.10 }
      ];

      // Thử tuần tự nhiều chiến lược tăng nhạy
      let result = null;
      for (const strat of DETECT_STRATEGIES_IMPROVED) {
        try {
          if (strat.engine === 'tiny') {
            result = await detectTiny(off, { inputSize: strat.inputSize, threshold: strat.threshold });
          } else {
            result = await detectSSD(off, { minConfidence: strat.minConfidence });
          }
        } catch (e) {
          console.warn(`⚠️ Lỗi detect (${strat.engine})`, e?.message || e);
        }
        if (result) break;
      }

      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      fa.matchDimensions(canvas, displaySize);

      // Tối ưu readback cho fromPixels/getImageData bằng willReadFrequently
      try { canvas.getContext('2d', { willReadFrequently: true }); } catch {}
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result) {
        try {
          const resized = fa.resizeResults(result, displaySize);
          fa.draw.drawDetections(canvas, resized);
          fa.draw.drawFaceLandmarks(canvas, resized);
        } catch (drawErr) {
          console.warn('⚠️ Lỗi vẽ khung/landmarks:', drawErr?.message || drawErr);
        }

        if (!isSubmittingRef.current && result.descriptor) {
          // Kiểm tra userID trước khi gửi - BẮT BUỘC PHẢI CÓ
          const currentUserId = getCurrentUserId();
          if (!currentUserId) {
            console.error('❌ Không tìm thấy userID đăng nhập hiện tại');
            setScanResult({
              success: false,
              message: 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại trước khi chấm công.',
              timestamp: new Date().toLocaleString()
            });
            stopScan();
            return;
          }
          
          const descriptor = Array.from(result.descriptor);
          console.log('✅ Tạo descriptor 128 chiều cho userID:', currentUserId, 'length:', descriptor.length, 'sample:', descriptor.slice(0, 5));
          
          // Thành công → hủy timeout tổng
          if (scanTimeoutRef.current) { 
            clearTimeout(scanTimeoutRef.current); 
            scanTimeoutRef.current = null; 
          }
          
          // Gửi descriptor cùng với userID để backend kiểm tra khớp
          await submitDescriptor(descriptor, currentUserId);
          return;
        }
      } else {
        console.warn('⚠️ Không phát hiện được khuôn mặt trong khung hình ở lần thử này (Tiny+SSD đều không ra).');
        // Vẽ khung hướng dẫn khi không detect được
        try {
          ctx.strokeStyle = '#ff4d4f';
          ctx.lineWidth = 3;
          const padW = Math.round(displaySize.width * 0.15);
          const padH = Math.round(displaySize.height * 0.18);
          ctx.strokeRect(padW, padH, displaySize.width - padW * 2, displaySize.height - padH * 2);
          ctx.font = '18px sans-serif';
          ctx.fillStyle = '#ff4d4f';
          ctx.fillText('Đưa mặt vào khung đỏ, nhìn thẳng và giữ ổn định', padW + 8, padH - 10);
        } catch {}
        setScanResult({
          success: false,
          message: 'Không phát hiện được khuôn mặt. Vui lòng điều chỉnh vị trí/ánh sáng và thử lại.',
          timestamp: new Date().toLocaleString()
        });
      }
    } catch (err) {
      console.error('❌ Lỗi detect/mô hình:', err);
      setScanResult({
        success: false,
        message: err.message || 'Lỗi mô hình/TensorFlow khi xử lý ảnh. Vui lòng tải lại trang.',
        timestamp: new Date().toLocaleString()
      });
    }
  }, [modelsLoaded, submitDescriptor, stopScan]); // BỎ DETECT_STRATEGIES khỏi dependencies

  // CẢI THIỆN: Tăng số lần thử và giảm interval để tăng độ nhạy - TRÁNH DUPLICATE
  const captureWithRetries = useCallback(async () => {
    // KIỂM TRA TRÁNH DUPLICATE CALLS
    if (isSubmittingRef.current || detectionAbortRef.current || apiCallLockRef.current) {
      console.log('🚫 Bỏ qua captureWithRetries - đang xử lý');
      return;
    }

    const maxAttempts = 20;
    const intervalMs = 200;
    console.log('🎯 Bắt đầu capture với retries...');
    
    for (let attempt = 1; attempt <= maxAttempts && isScanningRef.current; attempt++) {
      console.log(`🔁 Capture attempt ${attempt}/${maxAttempts}`);
      await captureAndDetectOnce();
      
      // Nếu đang submit thì nghĩa là đã có kết quả và đang gửi → dừng retry
      if (isSubmittingRef.current || detectionAbortRef.current || apiCallLockRef.current) {
        console.log('✅ Đã có kết quả, dừng retry');
        return;
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    
    // Hết lượt thử mà chưa submit: báo thất bại ngay
    console.log('❌ Hết lượt thử, không phát hiện được khuôn mặt');
    setScanResult({
      success: false,
      message: 'Không phát hiện được khuôn mặt. Vui lòng điều chỉnh vị trí/ánh sáng và thử lại.',
      timestamp: new Date().toLocaleString()
    });
    // Dọn dẹp timeout và dừng quét
    if (scanTimeoutRef.current) { 
      clearTimeout(scanTimeoutRef.current); 
      scanTimeoutRef.current = null; 
    }
    stopScan();
  }, [captureAndDetectOnce, stopScan]);

  // Bắt đầu quét - SỬA LỖI MODELS LOADED STATE
  const startScan = useCallback(async () => {
    console.log('🚀 BẮT ĐẦU START SCAN...');
    
    // Reset tất cả state và ref ngay từ đầu
    setScanResult(null);
    setErrorMessage('');
    detectionAbortRef.current = false;
    apiCallLockRef.current = false;
    backendFallbackTriedRef.current = false;
    
    // KIỂM TRA VÀ CHẶN TRÙNG LẶP CHẶT CHẼ HƠN
    if (isScanningRef.current || isScanning) {
      console.warn('⚠️ Đang trong phiên quét, bỏ qua yêu cầu mới.');
      return;
    }

    // KIỂM TRA FACE-API SẴN SÀNG TRƯỚC (không dựa vào state)
    const fa = getFA();
    if (!fa || !fa.nets?.tinyFaceDetector?.params) {
      console.log('📦 Models chưa sẵn sàng, đang tải...');
      await loadModels();
      
      // Kiểm tra lại face-api sau khi load
      const faAfterLoad = getFA();
      if (!faAfterLoad || !faAfterLoad.nets?.tinyFaceDetector?.params) {
        console.error('❌ Không thể tải models');
        setErrorMessage('Không thể tải model nhận diện. Vui lòng tải lại trang.');
        return;
      }
      console.log('✅ Models đã sẵn sàng sau khi tải');
    } else {
      console.log('✅ Models đã sẵn sàng');
    }

    try {
      console.log('📹 Đang khởi tạo camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 },
          focusMode: 'continuous',
          whiteBalanceMode: 'continuous'
        }
      });
      
      setCurrentStream(stream);
      currentStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // CHỜ CAMERA SẴN SÀNG HOÀN TOÀN VỚI TIMEOUT
        console.log('⏳ Chờ camera sẵn sàng...');
        await new Promise((resolve, reject) => {
          const v = videoRef.current;
          if (!v) return reject(new Error('Video element không tồn tại'));
          
          let timeoutId = setTimeout(() => {
            reject(new Error('Camera timeout - không thể khởi tạo trong 10s'));
          }, 10000);
          
          const checkReady = () => {
            if (v.readyState >= 3 && v.videoWidth > 0 && v.videoHeight > 0) {
              clearTimeout(timeoutId);
              v.removeEventListener('loadedmetadata', checkReady);
              v.removeEventListener('canplay', checkReady);
              v.removeEventListener('loadeddata', checkReady);
              resolve();
            }
          };
          
          if (v.readyState >= 3 && v.videoWidth > 0) {
            clearTimeout(timeoutId);
            resolve();
          } else {
            v.addEventListener('loadedmetadata', checkReady);
            v.addEventListener('canplay', checkReady);
            v.addEventListener('loadeddata', checkReady);
          }
        });

        console.log(`📐 Kích thước video: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);

        // SET STATE SCANNING NGAY SAU KHI CAMERA SẴN SÀNG
        setIsScanning(true);
        console.log('✅ Camera đã sẵn sàng, bắt đầu quét...');

        // WARM-UP NHANH VÀ ĐƠN GIẢN - SỬA LỖI CÚ PHÁP
        try {
          console.log('🔥 Warm-up model nhanh...');
          const v = videoRef.current;
          const off = document.createElement('canvas');
          off.width = v.videoWidth; 
          off.height = v.videoHeight;
          const offCtx = off.getContext('2d');
          offCtx.drawImage(v, 0, 0, off.width, off.height);
          
          // SỬA LỖI: Bỏ .catch() vì không phải Promise
          try {
            await fa
              .detectSingleFace(off, new fa.TinyFaceDetectorOptions({ 
                inputSize: 320, 
                threshold: 0.3 
              }))
              .withFaceLandmarks()
              .withFaceDescriptor();
            console.log('✅ Warm-up hoàn thành');
          } catch (warmupDetectErr) {
            console.warn('⚠️ Warm-up detect thất bại:', warmupDetectErr?.message);
          }
        } catch (warmupErr) {
          console.warn('⚠️ Warm-up thất bại:', warmupErr?.message);
        }

        // BẮT ĐẦU COUNTDOWN VÀ QUÉT NGAY LẬP TỨC - TRÁNH DUPLICATE
        setCountdown(3);
        let timerStarted = false; // Thêm flag để tránh duplicate
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              if (!timerStarted) { // Chỉ chạy 1 lần
                timerStarted = true;
                console.log('🎯 Bắt đầu capture và detect...');
                captureWithRetries();
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Thiết lập timeout tổng cho phiên quét
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
        scanTimeoutRef.current = setTimeout(() => {
          console.error('⏰ Timeout quét khuôn mặt');
          setScanResult({
            success: false,
            message: 'Hết thời gian quét. Vui lòng đưa mặt vào khung và thử lại.',
            timestamp: new Date().toLocaleString()
          });
          stopScan();
        }, 20000);
      }
    } catch (error) {
      console.error('❌ Lỗi khi khởi tạo camera:', error);
      setErrorMessage(`Không thể truy cập camera: ${error.message}`);
      // Reset state khi lỗi
      setIsScanning(false);
      setCurrentStream(null);
      currentStreamRef.current = null;
    }
  }, [loadModels, captureWithRetries, stopScan, isScanning]);

  // Cleanup chỉ khi UNMOUNT
  useEffect(() => {
    return () => {
      stopCameraCompletely();
    };
  }, [stopCameraCompletely]);

  return (
    <div className="face-scan-container">
      <div className="face-scan-header">
        <h1>QUÉT KHUÔN MẶT ĐIỂM DANH</h1>
        <p>Quét khuôn mặt của bạn để điểm danh nhanh chóng và chính xác</p>
      </div>

      <div className="face-scan-content">
        <div className="video-container">
          <div className={`scanner-frame ${isScanning ? 'active' : ''}`}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="face-canvas" />
            {isScanning && (
              <div className="scanning-overlay">
                <div className="scanning-line"></div>
                {countdown > 0 && <div className="countdown">{countdown}</div>}
              </div>
            )}
          </div>

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

        <div className="scan-controls">
          {!isScanning ? (
            <button
              className="btn-scan-face"
              onClick={startScan}
              disabled={loadingModels || isSubmitting}
            >
              {loadingModels ? 'Đang tải...' : 'Quét Khuôn Mặt'}
            </button>
          ) : (
            <button className="btn-stop-scan" onClick={stopScan} disabled={isSubmitting}>
              {isSubmitting ? 'Đang xác thực...' : 'Dừng Quét'}
            </button>
          )}
        </div>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {scanResult && (
          <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
            <div className="result-icon">{scanResult.success ? '✅' : '❌'}</div>
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