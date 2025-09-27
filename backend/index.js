// Chuyển sang server khởi động chuẩn MVC
require('./server');
const attendanceRoutes = require('./routes/attendance.routes');
app.use('/api/attendance', attendanceRoutes);