import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MenuItem } from './types';
import { suggestMeal } from './services/geminiService';
import { FileUploader } from './components/FileUploader';
import { MenuDisplay } from './components/MenuDisplay';
import { OrderSummary } from './components/OrderSummary';
import { GeminiSuggester } from './components/GeminiSuggester';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MenuExporter } from './components/MenuExporter';

declare const XLSX: any;

const App: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingPremade, setIsLoadingPremade] = useState(false);

  const handleFileUploaded = useCallback((data: any[]) => {
    setError(null);
    try {
      const formattedData: MenuItem[] = data.map((row, index) => {
        const name = row['Tên Món'] || row['Name'] || row['tên món'] || row['name'];
        const price = row['Giá'] || row['Price'] || row['giá'] || row['price'];
        const category = row['Loại'] || row['Category'] || row['loại'] || row['category'] || 'Chưa phân loại';
        
        if (!name || price === undefined || price === null) {
          throw new Error(`Dòng ${index + 2} thiếu cột 'Tên Món' hoặc 'Giá'.`);
        }
        
        const numericPrice = Number(String(price).replace(/[^0-9.-]+/g,""));
        if (isNaN(numericPrice)) {
            throw new Error(`Giá không hợp lệ cho món "${name}" ở dòng ${index + 2}. Giá phải là một con số.`);
        }

        return {
          id: `${name}-${index}`,
          name: String(name),
          price: numericPrice,
          category: String(category),
        };
      });
      setMenuItems(formattedData);
      setSelectedItems([]);
      setSelectedCategory('all');
      setSearchQuery('');
    } catch (e) {
      if (e instanceof Error) {
        setError(`Lỗi xử lý tệp: ${e.message}`);
      } else {
        setError('Đã xảy ra lỗi không xác định khi xử lý tệp.');
      }
      setMenuItems([]);
    }
  }, []);

  const handleLoadPremadeMenu = useCallback(async () => {
    if (typeof XLSX === 'undefined') {
      setError("Thư viện phân tích tệp (SheetJS) chưa được tải. Vui lòng kiểm tra kết nối internet của bạn và thử lại.");
      return;
    }
    
    setIsLoadingPremade(true);
    setError(null);
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1GwpW98wxHE8UcqNjKyZHkN7hyx52BTc0A2RlGU_NZfY/gviz/tq?tqx=out:csv';

    try {
      const response = await fetch(sheetUrl);
      if (!response.ok) {
        throw new Error(`Không thể tải menu có sẵn. Trạng thái: ${response.status}`);
      }
      const csvText = await response.text();
      // Google Sheets CSV export can include a UTF-8 BOM which can trip up parsers.
      const cleanCsvText = csvText.startsWith('\ufeff') ? csvText.substring(1) : csvText;

      const workbook = XLSX.read(cleanCsvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      handleFileUploaded(jsonData);

    } catch (e) {
      console.error("Error loading pre-made menu:", e);
      if (e instanceof Error) {
        setError(`Lỗi tải menu có sẵn: ${e.message}`);
      } else {
        setError('Đã xảy ra lỗi không xác định khi tải menu có sẵn.');
      }
    } finally {
      setIsLoadingPremade(false);
    }
  }, [handleFileUploaded]);

  const handleSelectItem = useCallback((item: MenuItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.find(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  }, []);
  
  const handleRemoveItem = useCallback((item: MenuItem) => {
    setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
  }, []);

  const handleUpdateQuantity = useCallback((itemToUpdate: MenuItem, newQuantity: number) => {
    setSelectedItems(prev => {
        if (newQuantity <= 0) {
            return prev.filter(item => item.id !== itemToUpdate.id);
        }
        return prev.map(item => 
            item.id === itemToUpdate.id 
                ? { ...item, quantity: newQuantity } 
                : item
        );
    });
  }, []);


  const handleClearOrder = useCallback(() => {
    setSelectedItems([]);
  }, []);
  
  const handleSuggestion = useCallback((suggested: MenuItem[]) => {
    const suggestedWithQuantity = suggested.map(item => ({...item, quantity: 1}));
    setSelectedItems(suggestedWithQuantity);
  }, []);
  
  const totalPrice = useMemo(() => {
    return selectedItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  }, [selectedItems]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(menuItems.map(item => item.category)))], [menuItems]);

  const handleSelectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredMenuItems = useMemo(() => {
    let items = menuItems;

    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Lỗi: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {menuItems.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Chào mừng đến với Trình lập kế hoạch thực đơn AI</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
             Bắt đầu bằng cách tải lên thực đơn của bạn ở định dạng Excel (.xlsx) hoặc CSV (.csv), hoặc sử dụng menu có sẵn của chúng tôi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <FileUploader onFileUploaded={handleFileUploaded} onError={setError} />
                <button
                    onClick={handleLoadPremadeMenu}
                    disabled={isLoadingPremade}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-md disabled:bg-teal-400 disabled:cursor-wait flex items-center justify-center"
                >
                    {isLoadingPremade ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang tải...
                        </>
                    ) : (
                        'Dùng Menu có sẵn'
                    )}
                </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <OrderSummary 
                      selectedItems={selectedItems} 
                      totalPrice={totalPrice} 
                      onClearOrder={handleClearOrder}
                      onRemoveItem={handleRemoveItem}
                      onUpdateQuantity={handleUpdateQuantity}
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onSelectCategory={handleSelectCategory}
                      searchQuery={searchQuery}
                      onSearchChange={handleSearchChange}
                    />
                </div>
                <div>
                    <GeminiSuggester menu={menuItems} onSuggestion={handleSuggestion} />
                </div>
            </div>

            <div className="mt-8">
                <MenuDisplay 
                  menuItems={filteredMenuItems} 
                  selectedItems={selectedItems} 
                  onSelectItem={handleSelectItem}
                />
            </div>

            <div className="text-center mt-4 flex justify-center items-center gap-4">
               <FileUploader onFileUploaded={handleFileUploaded} onError={setError} isReupload={true} />
               <MenuExporter menuItems={menuItems} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;