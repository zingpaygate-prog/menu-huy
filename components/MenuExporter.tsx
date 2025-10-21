import React from 'react';
import { MenuItem } from '../types';

interface MenuExporterProps {
  menuItems: MenuItem[];
}

export const MenuExporter: React.FC<MenuExporterProps> = ({ menuItems }) => {
  const handleExport = () => {
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

    // 2. Group menu by category
    const groupedMenu = menuItems.reduce((acc: Record<string, MenuItem[]>, item) => {
      const category = item.category || 'Chưa phân loại';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    // 3. Setup drawing variables
    const margin = 200;
    const contentWidth = canvas.width - (margin * 2);
    const columnWidth = contentWidth / 2 - 50;
    const column1X = margin;
    const column2X = margin + columnWidth + 100;

    let currentX = column1X;
    let currentY = 250;
    let isColumn1 = true;

    const categoryFont = 'bold 52px Arial';
    const itemFont = '42px Arial';
    const itemLineHeight = 65;
    const categorySpacing = 80;
    const maxColumnY = canvas.height - 300; // Leave some footer margin

    ctx.fillStyle = '#4A4A4A';

    const categories = Object.keys(groupedMenu);

    // 4. Draw menu items
    for (const category of categories) {
      const items = groupedMenu[category];
      const blockHeight = categorySpacing + (items.length * itemLineHeight) + 20;

      if (currentY + blockHeight > maxColumnY && isColumn1) {
        currentY = 250;
        currentX = column2X;
        isColumn1 = false;
      }

      if (currentY + blockHeight > maxColumnY && !isColumn1) {
          console.warn("Menu is too long to fit completely on the image.");
          break;
      }
      
      ctx.font = categoryFont;
      ctx.textAlign = 'left';
      ctx.fillText(category, currentX, currentY);
      currentY += categorySpacing;

      ctx.font = itemFont;
      for (const item of items) {
        const priceText = `${new Intl.NumberFormat('vi-VN').format(item.price)}đ`;
        const maxItemNameWidth = columnWidth - ctx.measureText(priceText).width - 20;

        let itemName = item.name;
        if (ctx.measureText(itemName).width > maxItemNameWidth) {
            while(ctx.measureText(itemName + '...').width > maxItemNameWidth) {
                itemName = itemName.slice(0, -1);
            }
            itemName += '...';
        }
        
        ctx.textAlign = 'left';
        ctx.fillText(itemName, currentX, currentY);
        
        ctx.textAlign = 'right';
        ctx.fillText(priceText, currentX + columnWidth, currentY);
        
        currentY += itemLineHeight;
      }
      currentY += 20;
    }

    // 5. Trigger download
    const link = document.createElement('a');
    link.download = 'Thuc_don.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center shadow"
      aria-label="Xuất Menu thành ảnh"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      Xuất Menu thành ảnh
    </button>
  );
};