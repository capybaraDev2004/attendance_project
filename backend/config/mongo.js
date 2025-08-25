// backend/config/mongo.js
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017'; // như ảnh
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'attendance_face';   // đặt tên DB; có thể đổi bằng ENV

let dbPromise = null;

// Kết nối lười, dùng chung một connection cho toàn app
function getDb() {
	if (!dbPromise) {
		const client = new MongoClient(MONGO_URI, { maxPoolSize: 10 });
		dbPromise = client.connect().then((c) => c.db(MONGO_DB_NAME));
	}
	return dbPromise;
}

module.exports = { getDb };
