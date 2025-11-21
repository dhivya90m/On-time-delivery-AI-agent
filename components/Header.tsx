
import React from 'react';

interface HeaderProps {
  onOpenSettings: () => void;
  environment: 'sandbox' | 'enterprise';
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, environment }) => {
  return (
    <header className="bg-gray-800 shadow-md p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6a2 2 0 100-4 2 2 0 000 4zm0 14a2 2 0 100-4 2 2 0 000 4zm6-8a2 2 0 100-4 2 2 0 000 4zm-14 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">Logistics KPI AI Agent</h1>
          <p className="text-xs text-gray-400 hidden sm:block">Support Automation & Operational Intelligence</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Environment Status Badge */}
        <div 
          className={`flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
            environment === 'sandbox' 
              ? 'bg-green-900/30 border-green-500 text-green-400' 
              : 'bg-blue-900/30 border-blue-500 text-blue-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full mr-2 ${environment === 'sandbox' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></span>
          {environment === 'sandbox' ? 'ENV: SANDBOX (AI STUDIO)' : 'ENV: ENTERPRISE (VERTEX AI)'}
        </div>

        <button 
          onClick={onOpenSettings}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
          aria-label="System Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
