import React from 'react';
import AttendanceHistory from '../admin/AttendanceHistory';

// Tái sử dụng component AttendanceHistory cho customer (chỉ xem)
const CustomerAttendance = () => {
  return (
    <div>
      <AttendanceHistory />
    </div>
  );
};

export default CustomerAttendance;


