import React from 'react';
import { MenuItem } from '../types';

interface OrderImageExporterProps {
  selectedItems: MenuItem[];
  totalPrice: number;
}

export const OrderImageExporter: React.FC<OrderImageExporterProps> = ({ selectedItems, totalPrice }) => {
  const handleExport = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn món ăn trước khi xuất ảnh.");
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert("Trình duyệt của bạn không hỗ trợ tạo ảnh.");
      return;
    }

    // Set a standard size (like A4 ratio)
    canvas.width = 2480;
    canvas.height = 3508;

    // 1. Fill background with white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Setup drawing variables
    const margin = 200;
    let currentY = 250;
    
    const titleFont = 'bold 64px Arial';
    const itemFont = '42px Arial';
    const totalFont = 'bold 48px Arial';
    const itemLineHeight = 65;
    const titleSpacing = 100;

    ctx.fillStyle = '#4A4A4A';
    ctx.textAlign = 'center';

    // 3. Draw Title
    ctx.font = titleFont;
    ctx.fillText("Chi Tiết Đơn Hàng", canvas.width / 2, currentY);
    currentY += titleSpacing;

    // 4. Draw selected items
    ctx.font = itemFont;
    for (const item of selectedItems) {
      const priceText = `${new Intl.NumberFormat('vi-VN').format(item.price)}đ`;
      const itemName = item.name;
      
      ctx.textAlign = 'left';
      ctx.fillText(itemName, margin, currentY);
      
      ctx.textAlign = 'right';
      ctx.fillText(priceText, canvas.width - margin, currentY);
      
      currentY += itemLineHeight;
    }
    
    currentY += itemLineHeight / 2;
    
    // 5. Draw separator
    ctx.beginPath();
    ctx.moveTo(margin, currentY);
    ctx.lineTo(canvas.width - margin, currentY);
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.stroke();

    currentY += itemLineHeight;

    // 6. Draw Total
    ctx.font = totalFont;
    const totalText = "Tổng cộng:";
    const formattedTotal = `${new Intl.NumberFormat('vi-VN').format(totalPrice)}đ`;
    
    ctx.textAlign = 'left';
    ctx.fillText(totalText, margin, currentY);
    
    ctx.textAlign = 'right';
    ctx.fillText(formattedTotal, canvas.width - margin, currentY);
    
    // 7. Trigger download
    const link = document.createElement('a');
    link.download = 'Don_hang.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      disabled={selectedItems.length === 0}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center shadow-md disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
      aria-label="Xuất đơn hàng thành ảnh"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      Xuất ảnh đơn hàng
    </button>
  );
};