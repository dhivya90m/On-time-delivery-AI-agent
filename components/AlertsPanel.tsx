
import React, { useState } from 'react';
import { Alert } from '../types';
import { getCorrectiveActions } from '../services/geminiService';

interface AlertsPanelProps {
  alerts: Alert[];
  onLogAction: (alert: Alert, action: string) => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onLogAction }) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [recommendations, setRecommendations] = useState<Record<string, string[]>>({});

  const handleGetRecommendations = async (alert: Alert) => {
    setLoadingStates(prev => ({ ...prev, [alert.id]: true }));
    try {
      const actions = await getCorrectiveActions(alert);
      setRecommendations(prev => ({ ...prev, [alert.id]: actions }));
    } catch (error) {
      console.error('Failed to get recommendations', error);
      setRecommendations(prev => ({ ...prev, [alert.id]: ['Failed to load suggestions.'] }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [alert.id]: false }));
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center h-full">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-white">No Active Alerts</h3>
        <p className="text-gray-400 mt-1">All regions are currently meeting their On-Time Delivery targets.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">Active KPI Alerts</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {alerts.map(alert => (
          <div key={alert.id} className="bg-gray-700/50 p-4 rounded-md border border-yellow-500/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-yellow-400">{alert.region} - Week {alert.week}</p>
                <p className="text-sm text-gray-300">
                  OTD Rate dropped to <span className="font-bold text-red-400">{alert.otdRate}%</span> (Target: {alert.targetRate}%)
                </p>
              </div>
              {!recommendations[alert.id] && (
                <button
                  onClick={() => handleGetRecommendations(alert)}
                  disabled={loadingStates[alert.id]}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-3 rounded-md text-sm transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingStates[alert.id] ? 'Analyzing...' : 'Get Actions'}
                </button>
              )}
            </div>
            {recommendations[alert.id] && (
              <div className="mt-3 border-t border-gray-600 pt-3">
                <h4 className="text-sm font-semibold text-gray-200 mb-2">Recommended Actions:</h4>
                <ul className="space-y-2">
                  {recommendations[alert.id]?.map((action, index) => (
                    <li key={index} className="flex justify-between items-center text-sm bg-gray-900/40 p-2 rounded">
                      <span className="text-gray-300">{action}</span>
                      <button 
                        onClick={() => onLogAction(alert, action)}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-2 rounded transition"
                      >
                        Log Action
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsPanel;
