
import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  environment: 'sandbox' | 'enterprise';
  setEnvironment: (env: 'sandbox' | 'enterprise') => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, environment, setEnvironment }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-850">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            System Architecture Configuration
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => setEnvironment('sandbox')}
              className={`cursor-pointer border rounded-lg p-4 transition-all ${
                environment === 'sandbox' 
                  ? 'border-green-500 bg-green-900/20 ring-1 ring-green-500' 
                  : 'border-gray-600 hover:bg-gray-700/50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white">Sandbox Mode</h3>
                {environment === 'sandbox' && <span className="bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
              </div>
              <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                <li>Engine: <strong>Google AI Studio</strong></li>
                <li>Storage: Browser Memory (RAM)</li>
                <li>Security: Standard Encryption</li>
                <li>Speed: High (Gemini 2.5 Flash)</li>
                <li>Best for: Rapid Prototyping, Hackathons</li>
              </ul>
            </div>

            <div 
              onClick={() => setEnvironment('enterprise')}
              className={`cursor-pointer border rounded-lg p-4 transition-all ${
                environment === 'enterprise' 
                  ? 'border-blue-500 bg-blue-900/20 ring-1 ring-blue-500' 
                  : 'border-gray-600 hover:bg-gray-700/50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white">Enterprise Mode</h3>
                {environment === 'enterprise' && <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">SIMULATED</span>}
              </div>
              <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                <li>Engine: <strong>Vertex AI (GCP)</strong></li>
                <li>Storage: Snowflake / Databricks</li>
                <li>Security: SOC2, HIPAA, Private VPC</li>
                <li>Governance: IAM & Audit Logs</li>
                <li>Best for: Production at Scale (DoorDash)</li>
              </ul>
            </div>
          </div>

          {/* Educational Context */}
          <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
            <h4 className="text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">Why would DoorDash use Vertex AI?</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              While <strong>AI Studio</strong> is perfect for this portfolio project, a company like DoorDash processes millions of orders daily. 
              They would migrate this logic to <strong>Google Cloud Vertex AI</strong> to ensure:
            </p>
            <ul className="mt-2 space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span><strong>Data Residency:</strong> Ensuring customer PII never leaves their Virtual Private Cloud (VPC).</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span><strong>No Training:</strong> Explicit guarantees that their proprietary delivery data is not used to train public models.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span><strong>RAG at Scale:</strong> Connecting to a Vector Database to retrieve context from millions of historical support tickets.</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-700 bg-gray-850 flex justify-end">
          <button 
            onClick={onClose} 
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition duration-200"
          >
            Apply Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
