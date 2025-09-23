import React from "react";

/**
 * Component phân trang nâng cao với tính năng lựa chọn số dòng hiển thị
 * @param {Object} props - Các thuộc tính của component
 * @param {number} props.currentPage - Trang hiện tại
 * @param {number} props.totalPages - Tổng số trang
 * @param {Function} props.onPageChange - Hàm xử lý khi thay đổi trang
 * @param {number} props.maxVisiblePages - Số trang tối đa hiển thị (mặc định: 5)
 * @param {number} props.itemsPerPage - Số dòng hiển thị trên mỗi trang
 * @param {Function} props.onItemsPerPageChange - Hàm xử lý khi thay đổi số dòng hiển thị
 * @param {number} props.totalItems - Tổng số dòng dữ liệu
 * @param {Array} props.itemsPerPageOptions - Các tùy chọn số dòng hiển thị (mặc định: [5, 10, 20, 50])
 */
export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange, 
  maxVisiblePages = 5,
  itemsPerPage = 10,
  onItemsPerPageChange,
  totalItems = 0,
  itemsPerPageOptions = [5, 10, 20, 50]
}) {
  // Tính toán các trang sẽ hiển thị (tối đa 5 trang)
  const getVisiblePages = () => {
    const pages = [];
    const maxPages = 5; // Giới hạn tối đa 5 trang
    
    if (totalPages <= maxPages) {
      // Nếu tổng số trang <= 5, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Nếu tổng số trang > 5, tính toán để hiển thị 5 trang xung quanh trang hiện tại
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxPages - 1);
      
      // Điều chỉnh nếu gần cuối
      if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
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

  // Xử lý khi thay đổi số dòng hiển thị
  const handleItemsPerPageChange = (newItemsPerPage) => {
    if (onItemsPerPageChange && newItemsPerPage !== itemsPerPage) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  // Tính toán thông tin hiển thị
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Nếu không có dữ liệu thì không hiển thị phân trang
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 dark:bg-gray-800 dark:border-gray-700">
      {/* Thông tin và phân trang trong cùng 1 dòng */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        {/* Thông tin hiển thị */}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Hiển thị <span className="font-semibold text-gray-900 dark:text-white">{startItem}</span> đến <span className="font-semibold text-gray-900 dark:text-white">{endItem}</span> 
          trong tổng số <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> dòng
        </div>
        
        {/* Phân trang và lựa chọn số dòng */}
        <div className="flex items-center gap-15">
          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
            <ul className="flex items-center gap-1">
          {/* Nút Previous */}
          <li>
            <button 
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 ${
                canGoPrevious 
                  ? 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer' 
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
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

          {/* Các trang hiển thị (tối đa 5 trang) */}
          {visiblePages.map((page) => (
            <li key={page}>
              <button 
                onClick={() => handlePageClick(page)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium transition-all duration-200 ${
                  page === currentPage
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white'
                }`}
              >
                {page}
              </button>
            </li>
          ))}

          {/* Nút Next */}
          <li>
            <button 
              onClick={handleNext}
              disabled={!canGoNext}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 ${
                canGoNext 
                  ? 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer' 
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
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
          )}
          
          {/* Lựa chọn số dòng hiển thị */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Hiển thị:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:border-gray-500"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600 dark:text-gray-300">dòng/trang</span>
          </div>
        </div>
      </div>
    </div>
  );
}
