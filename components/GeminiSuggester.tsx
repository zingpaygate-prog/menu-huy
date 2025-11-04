import React, { useState } from 'react';
import { MenuItem } from '../types';
import { suggestMeal, suggestTeabreak } from '../services/geminiService';

declare const XLSX: any;

interface GeminiSuggesterProps {
  menu: MenuItem[];
  onSuggestion: (suggestedItems: MenuItem[]) => void;
}

const SuggestionOption: React.FC<{
  option: string[];
  menu: MenuItem[];
  onSelect: (items: MenuItem[]) => void;
  index: number;
}> = ({ option, menu, onSelect, index }) => {
  const [totalPrice, items] = React.useMemo(() => {
    const validItems = option
      .map(name => menu.find(item => item.name.toLowerCase() === name.toLowerCase()))
      .filter((item): item is MenuItem => !!item);
    const price = validItems.reduce((sum, item) => sum + item.price, 0);
    return [price, validItems];
  }, [option, menu]);

  const formattedTotalPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice);
  
  const handleExport = () => {
    if (items.length === 0 || typeof XLSX === 'undefined') return;

    const dataToExport = items.map(item => ({
      'Tên Món': item.name,
      'Loại': item.category,
      'Đơn giá': item.price,
    }));

    dataToExport.push({
      'Tên Món': '',
      'Loại': 'Tổng cộng',
      'Đơn giá': totalPrice,
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    worksheet['!cols'] = [
      { wch: 40 }, // Tên Món
      { wch: 20 }, // Loại
      { wch: 15 }, // Đơn giá
    ];

    const priceCol = 'C';
    for (let i = 2; i <= items.length + 2; i++) {
        const cellAddress = `${priceCol}${i}`;
        if (worksheet[cellAddress] && worksheet[cellAddress].v !== undefined) {
            worksheet[cellAddress].t = 'n';
            worksheet[cellAddress].z = '#,##0 "VND"';
        }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Gợi ý ${index + 1}`);
    XLSX.writeFile(workbook, `Goi_y_AI_${index + 1}.xlsx`);
  };


  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
      <h4 className="font-bold text-lg mb-2 text-indigo-600 dark:text-indigo-400">Lựa chọn {index + 1}</h4>
      <ul className="space-y-1 mb-3 list-disc list-inside text-gray-700 dark:text-gray-300">
        {items.map(item => <li key={item.id}>{item.name}</li>)}
        {items.length === 0 && <li className="text-gray-500 list-none">Không có món nào hợp lệ trong lựa chọn này.</li>}
      </ul>
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <p className="font-semibold">Tổng: <span className="font-mono">{formattedTotalPrice}</span></p>
          <div className="flex items-center space-x-2">
            <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors flex items-center"
                title="Tải gợi ý này dưới dạng Excel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Excel
            </button>
            <button
                onClick={() => onSelect(items)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors"
                >
                Chọn
            </button>
          </div>
      </div>
    </div>
  )
}


export const GeminiSuggester: React.FC<GeminiSuggesterProps> = ({ menu, onSuggestion }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTeabreakLoading, setIsTeabreakLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[][] | null>(null);

  const handleSuggest = async () => {
    if (!prompt.trim()) {
      setError("Vui lòng nhập những gì bạn muốn ăn.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const suggestedOptions = await suggestMeal(menu, prompt);
      if (suggestedOptions.length === 0) {
        setError("AI không thể tìm thấy gợi ý phù hợp. Vui lòng thử một yêu cầu khác.");
      } else {
        setSuggestions(suggestedOptions);
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Đã xảy ra lỗi không mong muốn.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestTeabreak = async () => {
    setIsTeabreakLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const suggestedOptions = await suggestTeabreak(menu);
      if (suggestedOptions.length === 0) {
        setError("AI không thể tìm thấy gợi ý tiệc trà phù hợp. Vui lòng kiểm tra xem thực đơn có đủ các loại món (bánh, hoa quả, đồ uống...).");
      } else {
        setSuggestions(suggestedOptions);
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Đã xảy ra lỗi không mong muốn.');
      }
    } finally {
      setIsTeabreakLoading(false);
    }
  };
  
  const handleSelectOption = (items: MenuItem[]) => {
    onSuggestion(items);
    setSuggestions(null);
  }
  
  const handleExportAll = () => {
    if (!suggestions || suggestions.length === 0 || typeof XLSX === 'undefined') return;

    const allDataToExport: any[] = [];
    
    suggestions.forEach((option, index) => {
      const validItems = option
        .map(name => menu.find(item => item.name.toLowerCase() === name.toLowerCase()))
        .filter((item): item is MenuItem => !!item);
      
      if (validItems.length === 0) return; 

      const totalPrice = validItems.reduce((sum, item) => sum + item.price, 0);

      // Add a header for the suggestion
      allDataToExport.push({
          'Gợi ý': `Lựa chọn ${index + 1}`,
          'Tên Món': '',
          'Loại': '',
          'Đơn giá': ''
      });

      // Add items for the current suggestion
      validItems.forEach(item => {
          allDataToExport.push({
              'Gợi ý': '',
              'Tên Món': item.name,
              'Loại': item.category,
              'Đơn giá': item.price
          });
      });

      // Add a total row for the suggestion
      allDataToExport.push({
          'Gợi ý': '',
          'Tên Món': 'Tổng cộng',
          'Loại': '',
          'Đơn giá': totalPrice
      });

      // Add a separator row (if it's not the last suggestion)
      if (index < suggestions.length - 1) {
          allDataToExport.push({}); // Empty object for a blank row
      }
    });
    
    if (allDataToExport.length === 0) {
        setError("Không có gợi ý hợp lệ nào để xuất.");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(allDataToExport, {
        header: ['Gợi ý', 'Tên Món', 'Loại', 'Đơn giá'] // Ensure column order
    });

    worksheet['!cols'] = [
      { wch: 20 }, // Gợi ý
      { wch: 40 }, // Tên Món
      { wch: 20 }, // Loại
      { wch: 15 }, // Đơn giá
    ];
    
    // Formatting the price column
    const priceCol = 'D';
    for (let i = 0; i < allDataToExport.length; i++) {
        const rowData = allDataToExport[i];
        if (typeof rowData['Đơn giá'] === 'number') {
            const cellAddress = `${priceCol}${i + 2}`; // +1 for header, +1 for 1-based index
            // The cell might not exist if the whole row is empty, so we check
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].t = 'n';
                worksheet[cellAddress].z = '#,##0 "VND"';
            }
        }
    }
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Tất cả gợi ý`);
    
    XLSX.writeFile(workbook, 'Tat_ca_goi_y_AI.xlsx');
  };


  const hasApiKey = !!process.env.API_KEY;

  if (!hasApiKey) {
    return (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-6 rounded-xl shadow-lg border border-yellow-300 dark:border-yellow-700 text-center">
            <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">Gợi ý AI đã bị tắt</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Gợi ý món ăn bằng AI không khả dụng vì khóa API Gemini chưa được định cấu hình.
            </p>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">AI Gợi ý Món ăn</h2>
      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="ví dụ: 'bữa trưa cho một người khoảng 150,000 VND' hoặc 'bữa tối thịnh soạn ít cay'"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          rows={3}
          disabled={isLoading || isTeabreakLoading}
        />
        <div className="flex flex-col sm:flex-row gap-2">
            <button
            onClick={handleSuggest}
            disabled={isLoading || isTeabreakLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
            >
            {isLoading ? (
                <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lấy gợi ý...
                </>
            ) : (
                '✨ Gợi ý theo yêu cầu'
            )}
            </button>
            <button
                onClick={handleSuggestTeabreak}
                disabled={isLoading || isTeabreakLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
                >
                {isTeabreakLoading ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tìm tiệc trà...
                    </>
                ) : (
                    '🍰 Gợi ý Tiệc Trà'
                )}
            </button>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}

        {!isLoading && !isTeabreakLoading && suggestions && suggestions.length > 0 && (
            <div className="mt-6 space-y-4">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Đây là một vài lựa chọn:</h3>
                {suggestions.map((option, index) => (
                    <SuggestionOption
                        key={index}
                        option={option}
                        menu={menu}
                        onSelect={handleSelectOption}
                        index={index}
                    />
                ))}
                <div className="pt-4 text-center">
                    <button
                        onClick={handleExportAll}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center shadow-md mx-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Tải xuống tất cả gợi ý (Excel)
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
