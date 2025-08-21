import React from 'react';

// Placeholder cho các tab đang phát triển
const UnderConstruction = ({ title = 'TÍNH NĂNG ĐANG PHÁT TRIỂN' }) => {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
    </div>
  );
};

export default UnderConstruction;
