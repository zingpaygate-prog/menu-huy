import React, { useMemo } from 'react';
import { MenuItem } from '../types';

interface MenuDisplayProps {
  menuItems: MenuItem[];
  selectedItems: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

const MenuItemCard: React.FC<{ item: MenuItem; isSelected: boolean; onSelect: () => void; }> = ({ item, isSelected, onSelect }) => {
    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price);
    
    return (
        <div
            onClick={onSelect}
            className={`cursor-pointer p-4 rounded-lg shadow-sm transition-all duration-200 border-2 ${
            isSelected
                ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-600'
                : 'bg-white dark:bg-gray-800 border-transparent hover:border-indigo-400 hover:shadow-md'
            }`}
        >
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</h4>
                <p className="font-mono text-gray-700 dark:text-gray-300">{formattedPrice}</p>
            </div>
        </div>
    );
};

export const MenuDisplay: React.FC<MenuDisplayProps> = ({ menuItems, selectedItems, onSelectItem }) => {
  const groupedMenu = useMemo(() => {
    return menuItems.reduce((acc: Record<string, MenuItem[]>, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems]);

  const selectedIds = useMemo(() => new Set(selectedItems.map(item => item.id)), [selectedItems]);

  return (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Thực đơn</h2>
      
      <div className="space-y-6">
        {Object.keys(groupedMenu).length > 0 ? (
          Object.keys(groupedMenu).map((category) => {
            const items = groupedMenu[category];
            return (
              <div key={category}>
                <h3 className="text-xl font-semibold mb-3 text-indigo-600 dark:text-indigo-400 capitalize border-b-2 border-indigo-200 dark:border-indigo-800 pb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(item => (
                    <MenuItemCard 
                        key={item.id} 
                        item={item}
                        isSelected={selectedIds.has(item.id)}
                        onSelect={() => onSelectItem(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Không tìm thấy món ăn nào phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
};