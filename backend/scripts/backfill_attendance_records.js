/*
  Script: Backfill attendance_records from attendance table
  Usage: node backend/scripts/backfill_attendance_records.js
*/
const { pool } = require('../config/database');

async function upsertAttendanceRecord({ userId, workDate, checkIn, checkOut }) {
  if (!checkIn || !checkOut) return;

  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const workedMinutesRaw = Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / 60000));
  const workedMinutes = Math.max(0, workedMinutesRaw - 60); // minus lunch 60m

  const FULL_DAY_MINUTES = 8 * 60 + 30; // 510

  const totalHours = +(workedMinutes / 60).toFixed(2);
  const standardHours = 8;
  const overtimeMinutes = Math.max(0, workedMinutes - FULL_DAY_MINUTES);
  const overtimeHours = +(overtimeMinutes / 60).toFixed(2);

  let workUnit = 0;
  if (workedMinutes < FULL_DAY_MINUTES) {
    const ratio = workedMinutes / FULL_DAY_MINUTES;
    if (ratio >= 0.75) workUnit = 0.75;
    else if (ratio >= 0.5) workUnit = 0.5;
    else if (ratio >= 0.25) workUnit = 0.25;
    else workUnit = 0;
  } else {
    workUnit = +(1 + overtimeMinutes / 60).toFixed(2);
  }

  const [exists] = await pool.execute(
    'SELECT recordID FROM attendance_records WHERE userID = ? AND work_date = ?',
    [userId, workDate]
  );

  if (exists.length > 0) {
    await pool.execute(
      `UPDATE attendance_records
       SET total_hours = ?, standard_hours = ?, overtime_hours = ?, work_unit = ?, updated_at = NOW()
       WHERE recordID = ?`,
      [totalHours, standardHours, overtimeHours, workUnit, exists[0].recordID]
    );
  } else {
    await pool.execute(
      `INSERT INTO attendance_records
       (userID, work_date, total_hours, standard_hours, overtime_hours, work_unit)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, workDate, totalHours, standardHours, overtimeHours, workUnit]
    );
  }
}

async function main() {
  try {
    console.log('🔎 Backfilling attendance_records from attendance...');
    const [rows] = await pool.execute(
      `SELECT user_id, work_date, check_in, check_out
       FROM attendance
       WHERE check_in IS NOT NULL AND check_out IS NOT NULL`
    );

    console.log(`Found ${rows.length} attendance rows with full check-in/out.`);
    for (const row of rows) {
      await upsertAttendanceRecord({
        userId: row.user_id,
        workDate: row.work_date,
        checkIn: row.check_in,
        checkOut: row.check_out
      });
    }
    console.log('✅ Backfill completed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  }
}

main();


