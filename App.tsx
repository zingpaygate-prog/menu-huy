import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MenuItem } from './types';
import { suggestMeal } from './services/geminiService';
import { FileUploader } from './components/FileUploader';
import { MenuDisplay } from './components/MenuDisplay';
import { OrderSummary } from './components/OrderSummary';
import { GeminiSuggester } from './components/GeminiSuggester';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const handleSelectItem = useCallback((item: MenuItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.find(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);
  
  const handleRemoveItem = useCallback((item: MenuItem) => {
    setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
  }, []);

  const handleClearOrder = useCallback(() => {
    setSelectedItems([]);
  }, []);
  
  const handleSuggestion = useCallback((suggested: MenuItem[]) => {
    setSelectedItems(suggested);
  }, []);
  
  const totalPrice = useMemo(() => {
    return selectedItems.reduce((total, item) => total + item.price, 0);
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
             Bắt đầu bằng cách tải lên thực đơn của bạn ở định dạng Excel (.xlsx) hoặc CSV (.csv). Vui lòng đảm bảo tệp của bạn có các cột như 'Tên Món', 'Giá' và 'Loại'.
            </p>
            <FileUploader onFileUploaded={handleFileUploaded} onError={setError} />
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

            <div className="text-center mt-4">
               <FileUploader onFileUploaded={handleFileUploaded} onError={setError} isReupload={true} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;