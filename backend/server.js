// backend/server.js
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 3001;

// Khởi tạo HTTP server và Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Gắn io vào app để sử dụng trong controller (req.app.get('io'))
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`API đang chạy tại http://localhost:${PORT}`);
});
