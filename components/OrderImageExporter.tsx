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
    const margin = 250;
    let currentY = 400;
    
    const titleFont = 'bold 90px Arial';
    const itemFont = '56px Arial';
    const priceFont = 'bold 60px Arial';
    const itemLineHeight = 90;
    const titleSpacing = 150;
    const sectionSpacing = 100;

    ctx.fillStyle = '#4A4A4A';
    ctx.textAlign = 'center';

    // 3. Draw Title
    ctx.font = titleFont;
    ctx.fillText("Thực Đơn Gợi Ý", canvas.width / 2, currentY);
    currentY += titleSpacing;

    // 4. Draw selected items
    ctx.font = itemFont;
    ctx.textAlign = 'left';
    const itemStartX = margin;
    for (const item of selectedItems) {
        // Stop if we run out of space
        if (currentY > canvas.height - 600) { 
             ctx.fillText("...", itemStartX, currentY);
             break;
        }
        const itemText = `- ${item.name} (x${item.quantity || 1})`;
        ctx.fillText(itemText, itemStartX, currentY);
        currentY += itemLineHeight;
    }
    
    currentY += sectionSpacing;
    
    // 5. Draw separator
    ctx.beginPath();
    ctx.moveTo(margin, currentY);
    ctx.lineTo(canvas.width - margin, currentY);
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 3;
    ctx.stroke();

    currentY += sectionSpacing;

    // 6. Draw Prices per Guest
    ctx.font = priceFont;
    ctx.textAlign = 'center';

    const guestCounts = [6];
    for (const guests of guestCounts) {
        const pricePerGuest = totalPrice / guests;
        const formattedPrice = `${new Intl.NumberFormat('vi-VN', {maximumFractionDigits: 0}).format(pricePerGuest)}đ / khách`;
        const text = `Giá cho bàn ${guests} người: ${formattedPrice}`;

        ctx.fillText(text, canvas.width / 2, currentY);
        currentY += itemLineHeight;
    }
    
    // 7. Trigger download
    const link = document.createElement('a');
    link.download = 'Menu_Goi_Y.png';
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
      aria-label="Xuất menu gợi ý thành ảnh"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      Xuất Menu gợi ý
    </button>
  );
};