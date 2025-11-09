
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon }) => {
  const changeColor = changeType === 'increase' ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4">
      <div className="bg-gray-700 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-semibold text-white">{value}</p>
          {change && (
            <p className={`text-sm font-semibold ${changeColor}`}>
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
