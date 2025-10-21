import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-gray-800 mt-8 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 md:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>&copy; {new Date().getFullYear()} Trình lập kế hoạch thực đơn AI. Được xây dựng với React, Tailwind CSS, và Gemini.</p>
            </div>
        </footer>
    );
};