// backend/controllers/face.controller.js
const { getDb } = require('../config/mongo');

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

    // Validate cơ bản
    if (userID === undefined || userID === null) {
      console.log('❌ Validation failed: missing userID');
      return res.status(400).json({ success: false, message: 'Thiếu userID.' });
    }
    if (!fullName || typeof fullName !== 'string') {
      console.log('❌ Validation failed: invalid fullName');
      return res.status(400).json({ success: false, message: 'Thiếu fullName hợp lệ.' });
    }

    // Chuẩn hóa userID về number nếu có thể, nếu không thì giữ nguyên
    const normalizedUserID = Number.isFinite(Number(userID)) ? Number(userID) : String(userID);
    console.log('🔄 Normalized userID:', normalizedUserID, 'type:', typeof normalizedUserID);

    const vector128 = validateDescriptor(descriptor);
    if (!vector128) {
      return res.status(400).json({
        success: false,
        message: 'descriptor phải là mảng 128 số hợp lệ.'
      });
    }

    console.log('✅ All validations passed, connecting to MongoDB...');

    // Kết nối MongoDB với timeout
    const db = await Promise.race([
      getDb(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000)
      )
    ]);

    console.log('✅ MongoDB connected successfully');
    
    const collection = db.collection('face_templates');

    // Tạo index duy nhất cho userID (không await để tránh treo)
    collection.createIndex({ userID: 1 }, { unique: true }).catch(err => {
      console.warn('⚠️ Index creation warning:', err.message);
    });

    const now = new Date();
    console.log('💾 Saving to MongoDB...');
    
    const result = await collection.updateOne(
      { userID: normalizedUserID },
      {
        $set: {
          userID: normalizedUserID,
          fullName,
          descriptor: vector128,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );

    console.log('✅ MongoDB save result:', {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
      upsertedId: result.upsertedId
    });

    const responseData = {
      success: true,
      message: result.upsertedCount > 0 ? 'Đã tạo dữ liệu khuôn mặt.' : 'Đã cập nhật dữ liệu khuôn mặt.',
      userID: normalizedUserID,
      timestamp: now.toISOString()
    };

    console.log('📤 Sending response:', responseData);
    return res.json(responseData);

  } catch (err) {
    console.error('❌ ERROR in enrollFace:', err);
    console.error('❌ Error stack:', err.stack);
    
    // Trả lỗi cụ thể thay vì đẩy cho middleware
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi máy chủ khi lưu dữ liệu khuôn mặt',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

// GET /api/face/enrollments
// Lấy danh sách tất cả đăng ký khuôn mặt
async function getEnrollments(req, res, next) {
  console.log('📋 === GET ENROLLMENTS API CALLED ===');
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Kết nối MongoDB với timeout
    const db = await Promise.race([
      getDb(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000)
      )
    ]);

    console.log('✅ MongoDB connected successfully');
    
    const collection = db.collection('face_templates');
    
    console.log('🔍 Querying face_templates collection...');
    
    // Lấy tất cả đăng ký, chỉ trả về thông tin cần thiết (không trả về descriptor)
    const enrollments = await collection.find({}, {
      projection: {
        userID: 1,
        fullName: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0 // Không trả về _id
      }
    }).sort({ createdAt: -1 }).toArray(); // Sắp xếp theo ngày tạo mới nhất

    console.log('✅ Found', enrollments.length, 'enrollments');

    const responseData = {
      success: true,
      enrollments: enrollments,
      count: enrollments.length
    };

    console.log('📤 Sending response with', enrollments.length, 'enrollments');
    return res.json(responseData);

  } catch (err) {
    console.error('❌ ERROR in getEnrollments:', err);
    console.error('❌ Error stack:', err.stack);
    
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi máy chủ khi lấy danh sách đăng ký khuôn mặt',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

// POST /api/face/attendance
// Body: { descriptor }
async function faceAttendance(req, res, next) {
  console.log('📸 === FACE ATTENDANCE API CALLED ===');
  console.log('📥 Request body keys:', Object.keys(req.body));
  console.log(' Descriptor preview:', req.body.descriptor?.slice(0, 5), '... (first 5 elements)');

  try {
    const { descriptor } = req.body;

    // Validate descriptor
    const vector128 = validateDescriptor(descriptor);
    if (!vector128) {
      return res.status(400).json({
        success: false,
        message: 'descriptor phải là mảng 128 số hợp lệ.'
      });
    }

    console.log('✅ Descriptor validation passed, connecting to MongoDB...');

    // Kết nối MongoDB để tìm khuôn mặt khớp
    const db = await Promise.race([
      getDb(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000)
      )
    ]);

    console.log('✅ MongoDB connected successfully');
    
    const collection = db.collection('face_templates');

    // Tìm khuôn mặt khớp nhất
    console.log('🔍 Searching for matching face...');
    
    let bestMatch = null;
    let bestDistance = Infinity;
    const threshold = 0.6; // Ngưỡng khoảng cách Euclidean

    // Lấy tất cả templates để so sánh
    const templates = await collection.find({}, { 
      projection: { userID: 1, fullName: 1, descriptor: 1 } 
    }).toArray();

    console.log(`🔍 Found ${templates.length} face templates to compare`);

    // So sánh với từng template
    for (const template of templates) {
      if (!template.descriptor || template.descriptor.length !== 128) {
        console.warn(`⚠️ Template ${template.userID} có descriptor không hợp lệ`);
        continue;
      }

      // Tính khoảng cách Euclidean
      let distance = 0;
      for (let i = 0; i < 128; i++) {
        const diff = vector128[i] - template.descriptor[i];
        distance += diff * diff;
      }
      distance = Math.sqrt(distance);

      console.log(`📊 Template ${template.userID} (${template.fullName}): distance = ${distance.toFixed(4)}`);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = template;
      }
    }

    console.log(` Best match: ${bestMatch ? bestMatch.fullName : 'None'}, distance: ${bestDistance.toFixed(4)}`);

    // Kiểm tra ngưỡng khoảng cách
    if (!bestMatch || bestDistance > threshold) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuôn mặt khớp. Vui lòng đăng ký khuôn mặt trước.'
      });
    }

    console.log(`✅ Face match found: ${bestMatch.fullName} (ID: ${bestMatch.userID})`);

    // Xác định loại chấm công (check-in hoặc check-out)
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toISOString();
    
    // Sử dụng MySQL để lưu lịch sử chấm công
    const { pool } = require('../config/database');
    
    try {
      // Kiểm tra trạng thái chấm công trong ngày
      const [existingRecords] = await pool.execute(
        'SELECT * FROM attendance WHERE user_id = ? AND work_date = ?',
        [bestMatch.userID, currentDate]
      );

      let attendanceType = 'check_in';

      if (existingRecords.length > 0) {
        if (!existingRecords[0].check_in) {
          // Chưa check-in, thực hiện check-in
          attendanceType = 'check_in';
          await pool.execute(
            'UPDATE attendance SET check_in = ?, device_in_id = ?, updated_at = NOW() WHERE attendance_id = ?',
            [currentTime, 'face_recognition', existingRecords[0].attendance_id]
          );
        } else if (!existingRecords[0].check_out) {
          // Đã check-in, thực hiện check-out
          attendanceType = 'check_out';
          await pool.execute(
            'UPDATE attendance SET check_out = ?, device_out_id = ?, updated_at = NOW() WHERE attendance_id = ?',
            [currentTime, 'face_recognition', existingRecords[0].attendance_id]
          );
        } else {
          // Đã check-in và check-out
          return res.status(400).json({
            success: false,
            message: 'Bạn đã hoàn thành chấm công trong ngày hôm nay.'
          });
        }
      } else {
        // Tạo bản ghi mới (check-in)
        attendanceType = 'check_in';
        await pool.execute(
          'INSERT INTO attendance (user_id, work_date, check_in, device_in_id) VALUES (?, ?, ?, ?)',
          [bestMatch.userID, currentDate, currentTime, 'face_recognition']
        );
      }

      console.log(`✅ Attendance recorded in MySQL: ${attendanceType} for ${bestMatch.fullName}`);

      const responseData = {
        success: true,
        message: `Chấm công ${attendanceType === 'check_in' ? 'giờ vào' : 'giờ ra'} thành công!`,
        data: {
          userID: bestMatch.userID,
          fullName: bestMatch.fullName,
          type: attendanceType,
          check_time: currentTime,
          work_date: currentDate
        }
      };

      console.log('📤 Sending response:', responseData);
      return res.json(responseData);

    } catch (mysqlError) {
      console.error('❌ MySQL error:', mysqlError);
      throw new Error('Lỗi khi lưu lịch sử chấm công vào cơ sở dữ liệu.');
    }

  } catch (err) {
    console.error('❌ ERROR in faceAttendance:', err);
    console.error('❌ Error stack:', err.stack);
    
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi máy chủ khi chấm công bằng khuôn mặt',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

module.exports = { enrollFace, getEnrollments, faceAttendance };
