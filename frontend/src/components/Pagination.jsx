import React from "react";

/**
 * Component phân trang với đầy đủ chức năng
 * @param {Object} props - Các thuộc tính của component
 * @param {number} props.currentPage - Trang hiện tại
 * @param {number} props.totalPages - Tổng số trang
 * @param {Function} props.onPageChange - Hàm xử lý khi thay đổi trang
 * @param {number} props.maxVisiblePages - Số trang tối đa hiển thị (mặc định: 5)
 */
export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange, 
  maxVisiblePages = 5 
}) {
  // Tính toán các trang sẽ hiển thị
  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Điều chỉnh startPage nếu endPage gần cuối
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  
  // Kiểm tra có thể đi đến trang trước không
  const canGoPrevious = currentPage > 1;
  
  // Kiểm tra có thể đi đến trang sau không
  const canGoNext = currentPage < totalPages;

  // Xử lý khi click vào trang
  const handlePageClick = (page) => {
    if (page !== currentPage && onPageChange) {
      onPageChange(page);
    }
  };

  // Xử lý khi click nút Previous
  const handlePrevious = () => {
    if (canGoPrevious && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  // Xử lý khi click nút Next
  const handleNext = () => {
    if (canGoNext && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  // Nếu chỉ có 1 trang thì không hiển thị phân trang
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="bg-white py-10 text-center dark:bg-dark">
      <div className="inline-flex gap-1 rounded-full border border-stroke p-3 dark:border-white/10">
        <ul className="flex items-center gap-1">
          {/* Nút Previous */}
          <li>
            <button 
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className={`flex h-10 min-w-10 items-center justify-center rounded-full px-2 transition-colors ${
                canGoPrevious 
                  ? 'text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-white/5 cursor-pointer' 
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
              title="Trang trước"
            >
              <svg
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.5 9.8125H4.15625L9.46875 4.40625C9.75 4.125 9.75 3.6875 9.46875 3.40625C9.1875 3.125 8.75 3.125 8.46875 3.40625L2 9.96875C1.71875 10.25 1.71875 10.6875 2 10.9688L8.46875 17.5312C8.59375 17.6562 8.78125 17.75 8.96875 17.75C9.15625 17.75 9.3125 17.6875 9.46875 17.5625C9.75 17.2812 9.75 16.8438 9.46875 16.5625L4.1875 11.2188H17.5C17.875 11.2188 18.1875 10.9062 18.1875 10.5312C18.1875 10.125 17.875 9.8125 17.5 9.8125Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </li>

          {/* Hiển thị trang đầu nếu cần */}
          {visiblePages[0] > 1 && (
            <>
              <li>
                <button 
                  onClick={() => handlePageClick(1)}
                  className="flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-white/5 transition-colors"
                >
                  1
                </button>
              </li>
              {visiblePages[0] > 2 && (
                <li className="flex h-10 min-w-10 items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-600">...</span>
                </li>
              )}
            </>
          )}

          {/* Các trang hiển thị */}
          {visiblePages.map((page) => (
            <li key={page}>
              <button 
                onClick={() => handlePageClick(page)}
                className={`flex h-10 min-w-10 items-center justify-center rounded-full px-2 transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-white'
                    : 'text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-white/5'
                }`}
              >
                {page}
              </button>
            </li>
          ))}

          {/* Hiển thị trang cuối nếu cần */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <li className="flex h-10 min-w-10 items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-600">...</span>
                </li>
              )}
              <li>
                <button 
                  onClick={() => handlePageClick(totalPages)}
                  className="flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-white/5 transition-colors"
                >
                  {totalPages}
                </button>
              </li>
            </>
          )}

          {/* Nút Next */}
          <li>
            <button 
              onClick={handleNext}
              disabled={!canGoNext}
              className={`flex h-10 min-w-10 items-center justify-center rounded-full px-2 transition-colors ${
                canGoNext 
                  ? 'text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-white/5 cursor-pointer' 
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
              title="Trang sau"
            >
              <svg
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 10L11.5312 3.4375C11.25 3.15625 10.8125 3.15625 10.5312 3.4375C10.25 3.71875 10.25 4.15625 10.5312 4.4375L15.7812 9.78125H2.5C2.125 9.78125 1.8125 10.0937 1.8125 10.4688C1.8125 10.8438 2.125 11.1875 2.5 11.1875H15.8437L10.5312 16.5938C10.25 16.875 10.25 17.3125 10.5312 17.5938C10.6562 17.7188 10.8437 17.7812 11.0312 17.7812C11.2187 17.7812 11.4062 17.7188 11.5312 17.5625L18 11C18.2812 10.7187 18.2812 10.2812 18 10Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
