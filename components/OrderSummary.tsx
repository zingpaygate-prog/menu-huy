import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MenuItem } from '../types';
import { OrderImageExporter } from './OrderImageExporter';

declare const XLSX: any;

interface OrderSummaryProps {
  selectedItems: MenuItem[];
  totalPrice: number;
  onClearOrder: () => void;
  onRemoveItem: (item: MenuItem) => void;
  onUpdateQuantity: (item: MenuItem, newQuantity: number) => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  menuItems: MenuItem[];
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ 
    selectedItems, 
    totalPrice, 
    onClearOrder, 
    onRemoveItem,
    onUpdateQuantity,
    categories,
    selectedCategory,
    onSelectCategory,
    searchQuery,
    onSearchChange,
    menuItems
}) => {
    const [numberOfGuests, setNumberOfGuests] = useState<number | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedItems.length === 0) {
            setNumberOfGuests(null);
        }
    }, [selectedItems]);

    const searchSuggestions = useMemo(() => {
        if (!searchQuery.trim()) {
            return [];
        }
        return menuItems
            .filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                item.name.toLowerCase() !== searchQuery.toLowerCase()
            )
            .slice(0, 5); // Limit to 5 suggestions
    }, [searchQuery, menuItems]);

    const handleSuggestionClick = (item: MenuItem) => {
        onSearchChange(item.name); 
        setShowSuggestions(false);
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsContainerRef.current && !suggestionsContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSuggestions]);
    
    const handleExport = () => {
        if (selectedItems.length === 0 || typeof XLSX === 'undefined') return;

        // FIX: Explicitly type `dataToExport` as `any[]` to allow for a summary row with different data types, resolving type errors on lines 91 and 92.
        const dataToExport: any[] = selectedItems.map(item => ({
          'Tên Món': item.name,
          'Loại': item.category,
          'Số lượng': item.quantity || 1,
          'Đơn giá': item.price,
          'Thành tiền': item.price * (item.quantity || 1),
        }));

        dataToExport.push({
          'Tên Món': '',
          'Loại': '',
          'Số lượng': '',
          'Đơn giá': 'Tổng cộng',
          'Thành tiền': totalPrice,
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        worksheet['!cols'] = [
          { wch: 40 }, // Tên Món
          { wch: 20 }, // Loại
          { wch: 10 }, // Số lượng
          { wch: 15 }, // Đơn giá
          { wch: 15 }, // Thành tiền
        ];
        
        const unitPriceCol = 'D';
        const subtotalCol = 'E';

        for (let i = 2; i <= selectedItems.length + 1; i++) {
            const unitPriceCellAddress = `${unitPriceCol}${i}`;
            if (worksheet[unitPriceCellAddress] && worksheet[unitPriceCellAddress].v !== undefined) {
                worksheet[unitPriceCellAddress].t = 'n';
                worksheet[unitPriceCellAddress].z = '#,##0 "VND"';
            }
            const subtotalCellAddress = `${subtotalCol}${i}`;
            if (worksheet[subtotalCellAddress] && worksheet[subtotalCellAddress].v !== undefined) {
                worksheet[subtotalCellAddress].t = 'n';
                worksheet[subtotalCellAddress].z = '#,##0 "VND"';
            }
        }
         const totalCellAddress = `${subtotalCol}${selectedItems.length + 2}`;
         if(worksheet[totalCellAddress]) {
            worksheet[totalCellAddress].t = 'n';
            worksheet[totalCellAddress].z = '#,##0 "VND"';
         }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Đơn hàng');

        XLSX.writeFile(workbook, 'Don_hang_menu.xlsx');
    };

    const formattedTotalPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice);

    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Đơn hàng của bạn</h2>
                {selectedItems.length > 0 && (
                    <button onClick={onClearOrder} className="text-sm font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                        Xóa tất cả
                    </button>
                )}
            </div>
            
            {/* Search and Filter Section */}
            <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                    <div className="relative" ref={suggestionsContainerRef}>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </span>
                        <input
                            type="search"
                            placeholder="Tìm kiếm món ăn..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onFocus={() => setShowSuggestions(true)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                <ul>
                                    {searchSuggestions.map(item => (
                                        <li 
                                            key={item.id}
                                            onClick={() => handleSuggestionClick(item)}
                                            className="px-4 py-3 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors duration-150"
                                            role="option"
                                            aria-selected="false"
                                        >
                                            <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    {categories.length > 2 && (
                        <div className="flex flex-wrap gap-2">
                            {categories.map(category => {
                                const isActive = category === selectedCategory;
                                return (
                                    <button
                                        key={category}
                                        onClick={() => onSelectCategory(category)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {category === 'all' ? 'Tất cả' : category}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedItems.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">Chọn các món từ thực đơn để thêm vào đây.</p>
                ) : (
                    selectedItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                            <span className="text-gray-700 dark:text-gray-300 pr-2 flex-1 truncate" title={item.name}>{item.name}</span>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button 
                                    onClick={() => onUpdateQuantity(item, (item.quantity || 1) - 1)}
                                    className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center font-bold text-lg transition-colors"
                                    aria-label={`Giảm số lượng ${item.name}`}
                                >-</button>
                                <span className="font-mono text-sm w-6 text-center">{item.quantity || 1}</span>
                                <button 
                                    onClick={() => onUpdateQuantity(item, (item.quantity || 1) + 1)}
                                    className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center font-bold text-lg transition-colors"
                                    aria-label={`Tăng số lượng ${item.name}`}
                                >+</button>
                                
                                <span className="font-mono text-sm text-gray-800 dark:text-gray-200 w-24 text-right">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * (item.quantity || 1))}
                                </span>

                                <button 
                                    onClick={() => onRemoveItem(item)} 
                                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-100 dark:hover:bg-gray-600 p-1"
                                    aria-label={`Xóa ${item.name}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedItems.length > 0 && (
                 <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Chi phí mỗi khách</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            {[6].map(guests => (
                               <button 
                                    key={guests} 
                                    onClick={() => setNumberOfGuests(guests === numberOfGuests ? null : guests)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${
                                        numberOfGuests === guests
                                            ? 'bg-indigo-600 text-white shadow'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {guests} người
                                </button>
                            ))}
                        </div>
                        {numberOfGuests && (
                            <div className="text-right flex-shrink-0 pl-2">
                                <p className="font-mono text-lg text-green-600 dark:text-green-400">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(totalPrice / numberOfGuests)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">/ khách</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-4 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                <div className="flex justify-between items-center text-xl font-bold">
                    <span className="text-gray-800 dark:text-gray-100">Tổng cộng</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{formattedTotalPrice}</span>
                </div>
                 {selectedItems.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                            onClick={handleExport}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center shadow-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Xuất sang Excel
                        </button>
                        <OrderImageExporter selectedItems={selectedItems} totalPrice={totalPrice} />
                    </div>
                )}
            </div>
        </div>
    );
};