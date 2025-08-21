import React, { useState } from 'react';

// Base trang tính công (placeholder, chưa gắn API)
const CustomerTimekeeping = () => {
  const today = new Date().toISOString().split('T')[0];
  const [range, setRange] = useState({ start: today, end: today });

  // Gợi ý: nút Áp dụng để thực thi filter khi người dùng chủ động
  const handleApply = () => {
    alert(`Áp dụng kỳ công từ ${range.start} đến ${range.end}`);
  };

  return (
    <div>
      <h2>Tính công</h2>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div>
            <div className="input-label">Từ ngày</div>
            <input
              type="date"
              value={range.start}
              onChange={(e) => setRange((prev) => ({ ...prev, start: e.target.value }))}
              className="form-input"
            />
          </div>
          <div>
            <div className="input-label">Đến ngày</div>
            <input
              type="date"
              value={range.end}
              onChange={(e) => setRange((prev) => ({ ...prev, end: e.target.value }))}
              className="form-input"
            />
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button className="qa-btn" onClick={handleApply}>Áp dụng</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th>Ngày</th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th>Tổng giờ</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody className="table-body">
              <tr>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerTimekeeping;


