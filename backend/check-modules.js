// Kiểm tra routes
console.log('🔍 Checking routes...');

try {
  const shiftsRoutes = require('./routes/shifts.routes');
  console.log('✅ Shifts routes loaded successfully');
  
  const shiftsController = require('./controllers/shifts.controller');
  console.log('✅ Shifts controller loaded successfully');
  
  const { pool } = require('./config/database');
  console.log('✅ Database config loaded successfully');
  
  // Test database connection
  pool.execute('SELECT 1 as test').then(([rows]) => {
    console.log('✅ Database connection test:', rows);
  }).catch(err => {
    console.error('❌ Database connection error:', err.message);
  });
  
} catch (error) {
  console.error('❌ Error loading modules:', error.message);
}
