import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Bil Awal | Cybermax Pre-Test
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
};
