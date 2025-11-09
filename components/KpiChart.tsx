
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DeliveryData, Region } from '../types';
import { KPI_THRESHOLD } from '../constants';

interface KpiChartProps {
  data: DeliveryData[];
  selectedRegion: Region;
}

const KpiChart: React.FC<KpiChartProps> = ({ data, selectedRegion }) => {
  const filteredData = data.filter(d => d.region === selectedRegion);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const isBelowThreshold = dataPoint.otdRate < KPI_THRESHOLD;
      return (
        <div className="bg-gray-700 p-3 rounded-md border border-gray-600 shadow-lg">
          <p className="font-bold text-gray-100">{`Week ${label}`}</p>
          <p className={`text-sm ${isBelowThreshold ? 'text-red-400' : 'text-cyan-400'}`}>{`OTD Rate: ${payload[0].value}%`}</p>
          <p className="text-sm text-gray-300">{`Target: ${KPI_THRESHOLD}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-96">
      <h3 className="text-lg font-semibold mb-4 text-white">{`Weekly OTD Rate: ${selectedRegion}`}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="week" stroke="#A0AEC0" tick={{ fill: '#A0AEC0' }} />
          <YAxis stroke="#A0AEC0" domain={[85, 100]} tick={{ fill: '#A0AEC0' }} unit="%" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#E2E8F0' }} />
          <Line type="monotone" dataKey="otdRate" stroke="#2DD4BF" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} name="OTD Rate" />
          <ReferenceLine y={KPI_THRESHOLD} label={{ value: 'Target', position: 'insideTopLeft', fill: '#F56565' }} stroke="#F56565" strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default KpiChart;
