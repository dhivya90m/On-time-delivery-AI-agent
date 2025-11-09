
import React from 'react';
import { TrackedAction } from '../types';

interface ActionTrackerProps {
  actions: TrackedAction[];
}

const ActionTracker: React.FC<ActionTrackerProps> = ({ actions }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg col-span-1 lg:col-span-2">
      <h3 className="text-lg font-semibold mb-4 text-white">Corrective Action Tracker</h3>
      <div className="overflow-x-auto max-h-96">
        {actions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No actions have been logged yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3">Region</th>
                <th scope="col" className="px-6 py-3">Week</th>
                <th scope="col" className="px-6 py-3">Action Taken</th>
                <th scope="col" className="px-6 py-3">Outcome</th>
                <th scope="col" className="px-6 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {actions.map(action => (
                <tr key={action.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-6 py-4 font-medium text-white">{action.alert.region}</td>
                  <td className="px-6 py-4">{action.alert.week}</td>
                  <td className="px-6 py-4">{action.actionTaken}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center">
                      {action.previousRate}% → {action.newRate}%
                      {action.newRate > action.previousRate ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400 ml-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400 ml-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{action.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ActionTracker;
