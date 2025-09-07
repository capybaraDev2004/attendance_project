const reportWebVitals = (onPerfEntry) => {
  // Ghi nhận các chỉ số hiệu năng nếu có callback được truyền vào
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Các API web-vitals tiêu chuẩn của CRA
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;


