import React, { useCallback } from 'react';

declare const XLSX: any;

interface FileUploaderProps {
  onFileUploaded: (data: any[]) => void;
  onError: (message: string) => void;
  isReupload?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded, onError, isReupload = false }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      onError("Thư viện phân tích tệp (SheetJS) chưa được tải. Vui lòng kiểm tra kết nối internet của bạn và thử lại.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        onFileUploaded(json);
      } catch (err) {
        console.error(err);
        onError('Không thể phân tích tệp đã tải lên. Vui lòng đảm bảo đó là tệp .xlsx hoặc .csv hợp lệ.');
      }
    };
    reader.onerror = () => {
        onError('Không thể đọc tệp.');
    };
    reader.readAsBinaryString(file);
    event.target.value = ''; // Reset file input
  }, [onFileUploaded, onError]);

  const buttonText = isReupload ? "Tải lên thực đơn khác" : "Tải lên Tệp Thực đơn";
  const buttonClasses = isReupload 
    ? "bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
    : "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-md";

  return (
    <div className="flex items-center justify-center">
      <label className={`cursor-pointer ${buttonClasses}`}>
        {buttonText}
        <input
          type="file"
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};