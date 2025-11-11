import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6a2 2 0 100-4 2 2 0 000 4zm0 14a2 2 0 100-4 2 2 0 000 4zm6-8a2 2 0 100-4 2 2 0 000 4zm-14 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
        <h1 className="text-xl md:text-2xl font-bold text-white">Logistics KPI AI Agent</h1>
      </div>
    </header>
  );
};

export default Header;