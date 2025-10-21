import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md">
            <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 6V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H2v13c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6h-6zm-6-2h4v2h-4V4zM4 8h16v11H4V8zm3 2v6h2v-6H7zm4 0v6h2v-6h-2zm4 0v6h2v-6h-2z"/>
                    </svg>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Trình lập kế hoạch thực đơn AI
                    </h1>
                </div>
            </div>
        </header>
    );
};