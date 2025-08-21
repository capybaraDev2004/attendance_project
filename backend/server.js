// backend/server.js
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API đang chạy tại http://localhost:${PORT}`);
});
