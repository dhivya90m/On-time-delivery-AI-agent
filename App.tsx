
import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [environment, setEnvironment] = useState<'sandbox' | 'enterprise'>('sandbox');

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans relative">
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        environment={environment}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        <Dashboard />
      </main>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        environment={environment}
        setEnvironment={setEnvironment}
      />
    </div>
  );
};

export default App;
