// backend/controllers/face.controller.js
const { getDb } = require('../config/mongo');

// Hàm helper để lấy thời gian Việt Nam chính xác theo định dạng MySQL datetime
function getVietnamTime() {
  const now = new Date();
  // Chuyển đổi sang múi giờ Việt Nam (UTC+7)
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  // Trả về định dạng MySQL datetime: YYYY-MM-DD HH:mm:ss
  return vietnamTime.toISOString().slice(0, 19).replace('T', ' ');
}

// Validate mảng descriptor gồm 128 số
function validateDescriptor(input) {
  console.log('🔍 Validating descriptor, type:', typeof input, 'isArray:', Array.isArray(input), 'length:', input?.length);
  if (!Array.isArray(input) || input.length !== 128) {
    console.log('❌ Descriptor validation failed: not array or wrong length');
    return null;
  }
  const arr = input.map((v) => Number(v));
  if (arr.some((v) => !Number.isFinite(v))) {
    console.log('❌ Descriptor validation failed: contains non-finite numbers');
    return null;
  }
  console.log('✅ Descriptor validation passed');
  return arr;
}

// POST /api/face/enroll
// Body: { userID, fullName, descriptor }
async function enrollFace(req, res, next) {
  console.log('📸 === FACE ENROLL API CALLED ===');
  console.log('📥 Request body keys:', Object.keys(req.body));
  console.log('📥 UserID:', req.body.userID, 'type:', typeof req.body.userID);
  console.log('📥 FullName:', req.body.fullName);
  console.log('📥 Descriptor preview:', req.body.descriptor?.slice(0, 5), '... (first 5 elements)');

  try {
    const { userID, fullName, descriptor } = req.body;

    if (userID === undefined || userID === null) {
      return res.status(400).json({ success: false, message: 'Thiếu userID.' });
    }
    if (!fullName || typeof fullName !== 'string') {
      return res.status(400).json({ success: false, message: 'Thiếu fullName hợp lệ.' });
    }

    const normalizedUserID = Number.isFinite(Number(userID)) ? Number(userID) : String(userID);

    const vector128 = validateDescriptor(descriptor);
    if (!vector128) {
      return res.status(400).json({ success: false, message: 'descriptor phải là mảng 128 số hợp lệ.' });
    }

    const db = await Promise.race([
      getDb(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000))
    ]);

    const collection = db.collection('face_templates');
    collection.createIndex({ userID: 1 }, { unique: true }).catch(() => {});

    const now = new Date();
    await collection.updateOne(
      { userID: normalizedUserID },
      {
        $set: { userID: normalizedUserID, fullName, descriptor: vector128, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    );

    return res.json({ success: true, message: 'Lưu mặt thành công', userID: normalizedUserID });
  } catch (err) {
    console.error('❌ ERROR in enrollFace:', err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi máy chủ khi lưu dữ liệu khuôn mặt' });
  }
}

// GET /api/face/enrollments
async function getEnrollments(req, res, next) {
  try {
    const db = await Promise.race([
      getDb(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000))
    ]);
    const collection = db.collection('face_templates');
    const enrollments = await collection.find({}, { projection: { _id: 0, descriptor: 0 } }).toArray();
    return res.json({ success: true, enrollments, count: enrollments.length });
  } catch (err) {
    console.error('❌ ERROR in getEnrollments:', err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi máy chủ' });
  }
}

// POST /api/face/attendance (so khớp toàn bộ) - giữ nguyên nếu bạn cần
async function faceAttendance(req, res, next) {
  // ... logic so khớp toàn bộ (đã có sẵn trong dự án của bạn) ...
  return res.status(501).json({ success: false, message: 'Use /api/face/attendance/current for current user matching.' });
}

// POST /api/face/attendance/current
// Body: { userID, descriptor } -> so khớp đúng user hiện tại và lưu attendance
async function faceAttendanceCurrent(req, res, next) {
  console.log('📸 === FACE ATTENDANCE CURRENT USER API CALLED ===');
  
  // Lưu thời điểm bắt đầu xử lý để đảm bảo tính chính xác
  const recognitionStartTime = new Date();
  console.log('⏰ Thời điểm bắt đầu nhận diện:', recognitionStartTime.toISOString());
  
  try {
    const { userID, descriptor } = req.body;

    if (userID === undefined || userID === null) {
      return res.status(400).json({ success: false, message: 'Thiếu userID hiện tại.' });
    }

    const vector128 = validateDescriptor(descriptor);
    if (!vector128) {
      return res.status(400).json({ success: false, message: 'descriptor phải là mảng 128 số hợp lệ.' });
    }

    const db = await Promise.race([
      getDb(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000))
    ]);
    const collection = db.collection('face_templates');

    const key = Number.isFinite(Number(userID)) ? Number(userID) : String(userID);
    const template = await collection.findOne(
      { userID: key },
      { projection: { userID: 1, fullName: 1, descriptor: 1 } }
    );

    if (!template || !template.descriptor || template.descriptor.length !== 128) {
      return res.status(404).json({ success: false, message: 'Không có dữ liệu khuôn mặt cho người dùng hiện tại.' });
    }

    // Chuẩn hóa L2 hai vector để đồng bộ hóa scale giữa các lần suy luận
    const l2 = (arr) => Math.sqrt(arr.reduce((s, v) => s + v * v, 0)) || 1;
    const v1n = vector128.map(v => v / l2(vector128));
    const v2n = template.descriptor.map(v => v / l2(template.descriptor));

    // Khoảng cách Euclidean trên vector đã chuẩn hóa
    let distance = 0;
    for (let i = 0; i < 128; i++) {
      const diff = v1n[i] - v2n[i];
      distance += diff * diff;
    }
    distance = Math.sqrt(distance);

    // Độ tương đồng Cosine
    let dot = 0;
    for (let i = 0; i < 128; i++) dot += v1n[i] * v2n[i];
    const cosineSim = dot; // đã chuẩn hóa → dot = cosine similarity

    // Cho phép cấu hình ngưỡng qua ENV, có giá trị mặc định an toàn
    const thresholdEu = Number(process.env.FACE_THRESHOLD_EUCLIDEAN) || 0.8;
    const thresholdCos = Number(process.env.FACE_THRESHOLD_COSINE) || 0.45;

    console.log('📏 Distance (euclidean):', distance, 'CosineSim:', cosineSim, 'Thresholds:', { thresholdEu, thresholdCos });

    if (distance > thresholdEu && cosineSim < thresholdCos) {
      return res.status(401).json({ success: false, message: 'Khuôn mặt không khớp với người dùng hiện tại.' });
    }

    console.log('✅ Khuôn mặt khớp! Khoảng cách:', distance, 'Cosine similarity:', cosineSim);

    // Lấy thời điểm nhận diện thành công (chính xác theo giờ Việt Nam)
    const recognitionSuccessTime = getVietnamTime();
    const currentDate = recognitionSuccessTime.split(' ')[0]; // Lấy phần ngày YYYY-MM-DD
    
    console.log('🎯 Thời điểm nhận diện thành công:', recognitionSuccessTime);
    console.log('📅 Ngày làm việc:', currentDate);

    // Lưu chấm công vào MySQL - CHỈ SỬ DỤNG BẢNG attendance
    const { pool } = require('../config/database');

    // Lấy device_id của face recognition system
    console.log('🔍 Tìm kiếm device face_recognition...');
    const [devices] = await pool.execute(
      'SELECT device_id FROM devices WHERE device_code = ? AND is_active = 1',
      ['face_recognition']
    );
    
    let deviceId = null;
    if (devices.length > 0) {
      deviceId = devices[0].device_id;
      console.log('✅ Tìm thấy device face_recognition với ID:', deviceId);
    } else {
      console.log('⚠️ Không tìm thấy device face_recognition, sẽ tạo mới...');
      // Tạo device mới nếu chưa có
      const [result] = await pool.execute(
        'INSERT INTO devices (device_code, device_name, location, is_active) VALUES (?, ?, ?, ?)',
        ['face_recognition', 'Face Recognition System', 'Web Application', 1]
      );
      deviceId = result.insertId;
      console.log('✅ Đã tạo device face_recognition với ID:', deviceId);
    }

    // KIỂM TRA BẢNG attendance để xác định loại chấm công - KIỂM TRA USERID TRƯỚC TIÊN
    console.log('🔍 KIỂM TRA USERID TRƯỚC TIÊN: Kiểm tra lịch sử chấm công trong ngày từ bảng attendance...');
    const [todayAttendance] = await pool.execute(
      'SELECT * FROM attendance WHERE user_id = ? AND work_date = ? ORDER BY created_at DESC',
      [template.userID, currentDate]
    );

    console.log('📊 Bản ghi attendance hôm nay:', todayAttendance.length > 0 ? 'Có' : 'Chưa có');
    if (todayAttendance.length > 0) {
      console.log('📋 Chi tiết bản ghi:', {
        attendance_id: todayAttendance[0].attendance_id,
        check_in: todayAttendance[0].check_in,
        check_out: todayAttendance[0].check_out,
        work_date: todayAttendance[0].work_date
      });
    }
    
    let attendanceType = 'check_in';
    let attendanceTime = recognitionSuccessTime;
    let needsDataFix = false; // Cờ đánh dấu có cần sửa dữ liệu không
    let fixedAttendanceId = null; // Lưu ID của bản ghi đã sửa

    // Xác định loại chấm công dựa trên bản ghi attendance - LOGIC ĐƯỢC CẢI THIỆN TRIỆT ĐỂ
    if (todayAttendance.length === 0) {
      // Chưa có bản ghi nào trong ngày → Check-in
      attendanceType = 'check_in';
      console.log('🟢 CHƯA CÓ bản ghi attendance trong ngày → CHECK-IN');
      
    } else if (todayAttendance.length === 1) {
      const record = todayAttendance[0];
      
      // Kiểm tra chi tiết hơn với NULL và empty string
      const hasCheckIn = record.check_in && record.check_in !== null && record.check_in !== '';
      const hasCheckOut = record.check_out && record.check_out !== null && record.check_out !== '';
      
      console.log('🔍 Phân tích bản ghi:', {
        hasCheckIn,
        hasCheckOut,
        check_in: record.check_in,
        check_out: record.check_out
      });
      
      // XỬ LÝ TRIỆT ĐỂ: Tự động sửa dữ liệu bị lỗi
      if (hasCheckIn && hasCheckOut) {
        // Trường hợp bị lỗi: có cả check_in và check_out cùng thời gian
        console.log('⚠️ PHÁT HIỆN DỮ LIỆU BỊ LỖI: có cả check_in và check_out cùng thời gian');
        
        // Kiểm tra xem có phải cùng thời gian không
        const checkInTime = new Date(record.check_in).getTime();
        const checkOutTime = new Date(record.check_out).getTime();
        const timeDiff = Math.abs(checkInTime - checkOutTime);
        
        if (timeDiff < 1000) { // Nếu chênh lệch dưới 1 giây (có thể coi là cùng lúc)
          console.log('🔧 TỰ ĐỘNG SỬA LỖI: Xóa check_out để chỉ giữ lại check_in');
          // Xóa check_out để chỉ giữ lại check_in
          await pool.execute(
            'UPDATE attendance SET check_out = NULL, device_out_id = NULL, updated_at = NOW() WHERE attendance_id = ?',
            [record.attendance_id]
          );
          console.log('✅ Đã sửa lỗi: chỉ giữ lại check_in, xóa check_out');
          attendanceType = 'check_out';
          needsDataFix = true; // Đánh dấu đã sửa dữ liệu
          fixedAttendanceId = record.attendance_id; // Lưu ID đã sửa
          console.log('🔴 Sau khi sửa lỗi → CHECK-OUT');
        } else {
          // Thực sự đã hoàn thành chấm công
          console.log('⚠️ Đã hoàn thành chấm công trong ngày (có cả check_in và check_out với thời gian khác nhau)');
          return res.status(400).json({ 
            success: false, 
            message: 'Bạn đã hoàn thành chấm công trong ngày hôm nay.',
            data: {
              check_in: record.check_in,
              check_out: record.check_out,
              work_date: currentDate,
              message_type: 'already_completed'
            }
          });
        }
      } else if (hasCheckIn && !hasCheckOut) {
        // Có check_in nhưng chưa có check_out → Check-out
        attendanceType = 'check_out';
        console.log('🔴 Có check_in nhưng chưa có check_out → CHECK-OUT');
      } else if (!hasCheckIn && !hasCheckOut) {
        // Trường hợp bất thường: không có cả check_in và check_out
        console.log('⚠️ Bản ghi attendance bất thường: không có check_in và check_out');
        // Xóa bản ghi bất thường và tạo mới
        await pool.execute(
          'DELETE FROM attendance WHERE attendance_id = ?',
          [record.attendance_id]
        );
        console.log('🗑️ Đã xóa bản ghi bất thường và sẽ tạo mới');
        attendanceType = 'check_in';
        needsDataFix = true; // Đánh dấu đã sửa dữ liệu
      } else {
        // Trường hợp bất thường khác
        console.log('⚠️ Bản ghi attendance bất thường:', record);
        return res.status(500).json({ 
          success: false, 
          message: 'Dữ liệu chấm công không hợp lệ. Vui lòng liên hệ quản trị viên.' 
        });
      }
    } else {
      // Có nhiều bản ghi (không nên xảy ra) - chỉ lấy bản ghi mới nhất
      console.log('⚠️ Có nhiều bản ghi attendance trong ngày:', todayAttendance.length);
      const latestRecord = todayAttendance[0]; // Đã ORDER BY created_at DESC
      
      const hasCheckIn = latestRecord.check_in && latestRecord.check_in !== null && latestRecord.check_in !== '';
      const hasCheckOut = latestRecord.check_out && latestRecord.check_out !== null && latestRecord.check_out !== '';
      
      if (hasCheckIn && !hasCheckOut) {
        attendanceType = 'check_out';
        console.log('🔴 Sử dụng bản ghi mới nhất: có check_in nhưng chưa có check_out → CHECK-OUT');
      } else if (hasCheckIn && hasCheckOut) {
        // Kiểm tra xem có phải cùng thời gian không
        const checkInTime = new Date(latestRecord.check_in).getTime();
        const checkOutTime = new Date(latestRecord.check_out).getTime();
        const timeDiff = Math.abs(checkInTime - checkOutTime);
        
        if (timeDiff < 1000) { // Nếu chênh lệch dưới 1 giây
          console.log('🔧 TỰ ĐỘNG SỬA LỖI: Xóa check_out để chỉ giữ lại check_in');
          await pool.execute(
            'UPDATE attendance SET check_out = NULL, device_out_id = NULL, updated_at = NOW() WHERE attendance_id = ?',
            [latestRecord.attendance_id]
          );
          console.log('✅ Đã sửa lỗi: chỉ giữ lại check_in, xóa check_out');
          attendanceType = 'check_out';
          needsDataFix = true; // Đánh dấu đã sửa dữ liệu
          fixedAttendanceId = latestRecord.attendance_id; // Lưu ID đã sửa
          console.log('🔴 Sau khi sửa lỗi → CHECK-OUT');
        } else {
          console.log('⚠️ Sử dụng bản ghi mới nhất: đã hoàn thành chấm công');
          return res.status(400).json({ 
            success: false, 
            message: 'Bạn đã hoàn thành chấm công trong ngày hôm nay.',
            data: {
              check_in: latestRecord.check_in,
              check_out: latestRecord.check_out,
              work_date: currentDate,
              message_type: 'already_completed'
            }
          });
        }
      } else {
        // Xóa tất cả bản ghi cũ và tạo mới
        await pool.execute(
          'DELETE FROM attendance WHERE user_id = ? AND work_date = ?',
          [template.userID, currentDate]
        );
        console.log('🗑️ Đã xóa tất cả bản ghi cũ và sẽ tạo mới');
        attendanceType = 'check_in';
        needsDataFix = true; // Đánh dấu đã sửa dữ liệu
      }
    }

    // Đảm bảo attendanceType được xác định đúng
    if (!attendanceType) {
      console.error('❌ Không thể xác định loại chấm công');
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi hệ thống: Không thể xác định loại chấm công' 
      });
    }

    // KIỂM TRA NGHIÊM NGẶT TRƯỚC KHI LƯU - LẤY DỮ LIỆU MỚI NHẤT SAU KHI SỬA LỖI
    console.log(` KIỂM TRA NGHIÊM NGẶT: Chuẩn bị lưu ${attendanceType}...`);
    
    // Lấy lại dữ liệu mới nhất sau khi có thể đã sửa lỗi
    let latestAttendance = [];
    if (needsDataFix && fixedAttendanceId) {
      // Nếu đã sửa lỗi, lấy lại dữ liệu của bản ghi đã sửa
      console.log('🔄 Lấy lại dữ liệu sau khi sửa lỗi...');
      const [fixedRecord] = await pool.execute(
        'SELECT * FROM attendance WHERE attendance_id = ?',
        [fixedAttendanceId]
      );
      latestAttendance = fixedRecord;
      console.log('📋 Dữ liệu sau khi sửa lỗi:', {
        attendance_id: fixedRecord[0]?.attendance_id,
        check_in: fixedRecord[0]?.check_in,
        check_out: fixedRecord[0]?.check_out
      });
    } else {
      // Lấy dữ liệu mới nhất như bình thường
      const [normalRecord] = await pool.execute(
        'SELECT * FROM attendance WHERE user_id = ? AND work_date = ? ORDER BY created_at DESC LIMIT 1',
        [template.userID, currentDate]
      );
      latestAttendance = normalRecord;
    }
    
    console.log('🔍 Dữ liệu mới nhất để kiểm tra:', {
      hasRecord: latestAttendance.length > 0,
      check_in: latestAttendance.length > 0 ? latestAttendance[0].check_in : null,
      check_out: latestAttendance.length > 0 ? latestAttendance[0].check_out : null
    });
    
    // KIỂM TRA NGHIÊM NGẶT TRƯỚC KHI LƯU - TUYỆT ĐỐI KHÔNG LƯU CẢ HAI
    if (attendanceType === 'check_in') {
      if (latestAttendance.length > 0) {
        const latest = latestAttendance[0];
        if (latest.check_in && latest.check_in !== null && latest.check_in !== '') {
          console.error('❌ KIỂM TRA THẤT BẠI: Đã có check_in nhưng vẫn cố lưu check_in mới');
          return res.status(500).json({ 
            success: false, 
            message: 'Lỗi hệ thống: Đã có check_in nhưng vẫn cố lưu check_in mới' 
          });
        }
      }
    } else if (attendanceType === 'check_out') {
      if (latestAttendance.length === 0) {
        console.error('❌ KIỂM TRA THẤT BẠI: Chưa có check_in nhưng cố lưu check_out');
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi hệ thống: Chưa có check_in nhưng cố lưu check_out' 
        });
      }
      const latest = latestAttendance[0];
      if (!latest.check_in || latest.check_in === null || latest.check_in === '') {
        console.error('❌ KIỂM TRA THẤT BẠI: Chưa có check_in nhưng cố lưu check_out');
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi hệ thống: Chưa có check_in nhưng cố lưu check_out' 
        });
      }
      if (latest.check_out && latest.check_out !== null && latest.check_out !== '') {
        console.error('❌ KIỂM TRA THẤT BẠI: Đã có check_out nhưng cố lưu check_out mới');
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi hệ thống: Đã có check_out nhưng cố lưu check_out mới' 
        });
      }
    }

    console.log('✅ KIỂM TRA NGHIÊM NGẶT THÀNH CÔNG: Có thể lưu', attendanceType);

    // Lưu thông tin chấm công vào bảng attendance (bảng tổng hợp)
    console.log(`💾 Lưu thông tin ${attendanceType} vào bảng attendance...`);
    console.log('⏰ Thời điểm nhận diện khuôn mặt:', attendanceTime);

    // Lưu vào bảng attendance - CHỈ LƯU CHECK_IN HOẶC CHECK_OUT, TUYỆT ĐỐI KHÔNG LƯU CẢ HAI
    let attendanceId = null;
    try {
      if (attendanceType === 'check_in') {
        // Check-in: INSERT mới với check_in, check_out để NULL
        const [insertResult] = await pool.execute(
          'INSERT INTO attendance (user_id, work_date, check_in, check_out, device_in_id, device_out_id, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, NULL, NOW(), NOW())',
          [template.userID, currentDate, attendanceTime, deviceId]
        );
        attendanceId = insertResult.insertId;
        console.log('✅ Đã lưu check_in vào bảng attendance (check_out = NULL) với ID:', attendanceId);
      } else {
        // Check-out: UPDATE chỉ check_out và device_out_id, giữ nguyên check_in
        const targetId = needsDataFix && fixedAttendanceId ? fixedAttendanceId : latestAttendance[0].attendance_id;
        const [updateResult] = await pool.execute(
          'UPDATE attendance SET check_out = ?, device_out_id = ?, updated_at = NOW() WHERE attendance_id = ? AND check_out IS NULL',
          [attendanceTime, deviceId, targetId]
        );
        
        if (updateResult.affectedRows === 0) {
          console.error('❌ Không tìm thấy bản ghi attendance để cập nhật check_out');
          return res.status(500).json({ 
            success: false, 
            message: 'Lỗi hệ thống: Không tìm thấy bản ghi chấm công để cập nhật' 
          });
        } else {
          attendanceId = targetId;
          console.log('✅ Đã cập nhật check_out vào bảng attendance với ID:', attendanceId);
        }
      }
    } catch (attendanceErr) {
      console.error('⚠️ Lỗi khi lưu vào bảng attendance:', attendanceErr.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lưu thông tin chấm công: ' + attendanceErr.message 
      });
    }

    // XÁC THỰC CUỐI CÙNG: Kiểm tra lại dữ liệu sau khi lưu
    console.log('🔍 XÁC THỰC CUỐI CÙNG: Kiểm tra dữ liệu sau khi lưu...');
    const [finalCheck] = await pool.execute(
      'SELECT check_in, check_out FROM attendance WHERE attendance_id = ?',
      [attendanceId]
    );
    
    if (finalCheck.length > 0) {
      const final = finalCheck[0];
      console.log('📋 Dữ liệu cuối cùng:', {
        check_in: final.check_in,
        check_out: final.check_out
      });
      
      // Kiểm tra xem có bị lỗi lưu cả hai không
      if (final.check_in && final.check_out && final.check_in !== null && final.check_out !== null) {
        const checkInTime = new Date(final.check_in).getTime();
        const checkOutTime = new Date(final.check_out).getTime();
        const timeDiff = Math.abs(checkInTime - checkOutTime);
        
        if (timeDiff < 1000) { // Nếu chênh lệch dưới 1 giây
          console.error('❌ PHÁT HIỆN LỖI NGHIÊM TRỌNG: Đã lưu cả check_in và check_out cùng lúc!');
          // Tự động sửa lỗi ngay lập tức
          await pool.execute(
            'UPDATE attendance SET check_out = NULL, device_out_id = NULL, updated_at = NOW() WHERE attendance_id = ?',
            [attendanceId]
          );
          console.log('✅ Đã tự động sửa lỗi nghiêm trọng');
        }
      }
    }

    // Tính toán thời gian xử lý để đảm bảo tính chính xác
    const processingTime = new Date() - recognitionStartTime;
    console.log(`⚡ Thời gian xử lý: ${processingTime}ms`);

    // Tạo thông báo phù hợp với loại chấm công
    let successMessage = '';
    let additionalInfo = '';
    
    if (attendanceType === 'check_in') {
      successMessage = 'Chấm công giờ vào thành công!';
      additionalInfo = 'Bạn có thể chấm công giờ ra sau khi hoàn thành công việc.';
    } else {
      successMessage = 'Chấm công giờ ra thành công!';
      additionalInfo = 'Bạn đã hoàn thành chấm công trong ngày hôm nay.';
    }

    return res.json({
      success: true,
      message: successMessage,
      additional_info: additionalInfo,
      data: {
        userID: template.userID,
        fullName: template.fullName,
        distance,
        cosineSim,
        type: attendanceType,
        check_time: attendanceTime,
        work_date: currentDate,
        processing_time_ms: processingTime,
        attendance_id: attendanceId,
        device_id: deviceId,
        is_completed: attendanceType === 'check_out'
      }
    });
  } catch (err) {
    console.error('❌ ERROR in faceAttendanceCurrent:', err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi máy chủ khi chấm công bằng khuôn mặt (current user)' });
  }
}

// Lấy lịch sử chấm công từ bảng attendance
async function getCheckinHistory(req, res, next) {
  try {
    const { userID, startDate, endDate, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        a.attendance_id,
        a.user_id,
        u.fullName,
        a.work_date,
        a.check_in,
        a.check_out,
        a.device_in_id,
        a.device_out_id,
        a.created_at,
        a.updated_at,
        CASE 
          WHEN a.check_in IS NOT NULL AND a.check_out IS NOT NULL THEN 'Completed'
          WHEN a.check_in IS NOT NULL AND a.check_out IS NULL THEN 'Check-in Only'
          ELSE 'Unknown'
        END as status
      FROM attendance a
      LEFT JOIN users u ON a.user_id = u.userID
      WHERE 1=1
    `;
    
    const params = [];
    
    if (userID) {
      query += ' AND a.user_id = ?';
      params.push(userID);
    }
    
    if (startDate) {
      query += ' AND a.work_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND a.work_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY a.work_date DESC, a.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const { pool } = require('../config/database');
    const [rows] = await pool.execute(query, params);
    
    return res.json({
      success: true,
      attendance_records: rows,
      count: rows.length
    });
    
  } catch (err) {
    console.error('❌ ERROR in getCheckinHistory:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message || 'Lỗi máy chủ khi lấy lịch sử chấm công' 
    });
  }
}

module.exports = { enrollFace, getEnrollments, faceAttendance, faceAttendanceCurrent, getCheckinHistory };
