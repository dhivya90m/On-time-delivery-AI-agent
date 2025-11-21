import React, { useState, useMemo, useEffect } from 'react';
import { KpiData, Alert } from '../types';
import { generateExecutiveBrief } from '../services/geminiService';

interface ExecutiveBriefProps {
  data: KpiData[];
  alerts: Alert[];
}

const ExecutiveBrief: React.FC<ExecutiveBriefProps> = ({ data, alerts }) => {
  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate available weeks from the dataset
  const availableWeeks = useMemo(() => {
    const weeks = Array.from(new Set(data.map(d => d.week)));
    return weeks.sort((a: number, b: number) => b - a); // Descending order
  }, [data]);

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // Default to the latest week when data loads
  useEffect(() => {
    if (availableWeeks.length > 0) {
      setSelectedWeek(availableWeeks[0]);
    }
  }, [availableWeeks]);

  const handleGenerate = async () => {
    if (selectedWeek === null) return;
    setLoading(true);
    try {
      const result = await generateExecutiveBrief(data, alerts, selectedWeek);
      setBrief(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (brief) {
      navigator.clipboard.writeText(brief);
      alert('Report copied to clipboard!');
    }
  };

  const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    // Simple markdown parser for bold, italic, and lists
    const htmlContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-cyan-400 mt-3 mb-1">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-4 mb-2">$1</h2>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>');
    
    return <div className="text-gray-300 space-y-2" dangerouslySetInnerHTML={{ __html: htmlContent.replace(/\n/g, '<br />') }} />;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg col-span-1 lg:col-span-2 border border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-900/50 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Automated Weekly Brief</h3>
            <p className="text-xs text-gray-400">Generate a strategic summary for stakeholders</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {availableWeeks.length > 0 && (
            <select
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="bg-gray-700 text-white text-sm rounded-md border border-gray-600 px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              disabled={loading}
            >
              {availableWeeks.map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          )}

          {!brief && (
             <button
             onClick={handleGenerate}
             disabled={loading || selectedWeek === null}
             className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 flex items-center whitespace-nowrap"
           >
             {loading ? (
               <>
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Drafting...
               </>
             ) : (
               'Generate Report'
             )}
           </button>
          )}
        </div>
      </div>

      {brief && (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
          <MarkdownContent content={brief} />
          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-700 pt-4">
             <button
              onClick={() => setBrief(null)}
              className="text-gray-400 hover:text-white text-sm font-medium px-3 py-2 transition"
            >
              Discard
            </button>
            <button
              onClick={handleCopy}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md text-sm transition duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveBrief;