import React, { useState } from 'react';
import { MenuItem } from '../types';
import { suggestMeal } from '../services/geminiService';

interface GeminiSuggesterProps {
  menu: MenuItem[];
  onSuggestion: (suggestedItems: MenuItem[]) => void;
}

export const GeminiSuggester: React.FC<GeminiSuggesterProps> = ({ menu, onSuggestion }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    if (!prompt.trim()) {
      setError("Vui lòng nhập những gì bạn muốn ăn.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const suggestedNames = await suggestMeal(menu, prompt);
      if (suggestedNames.length === 0) {
        setError("AI không thể tìm thấy gợi ý phù hợp. Vui lòng thử một yêu cầu khác.");
      } else {
        const suggestedItems = suggestedNames
          .map(name => menu.find(item => item.name.toLowerCase() === name.toLowerCase()))
          .filter((item): item is MenuItem => !!item);
        onSuggestion(suggestedItems);
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
          placeholder="ví dụ: 'bữa trưa nhẹ cho hai người' hoặc 'món gì đó cay và ăn chay'"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          rows={3}
          disabled={isLoading}
        />
        <button
          onClick={handleSuggest}
          disabled={isLoading}
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
            '✨ Nhận Gợi ý từ AI'
          )}
        </button>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
      </div>
    </div>
  );
};