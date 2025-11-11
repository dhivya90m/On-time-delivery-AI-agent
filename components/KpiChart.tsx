import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { KpiData, KpiName, Region } from '../types';
import { KPI_DEFINITIONS } from '../constants';

interface KpiChartProps {
  data: KpiData[];
  selectedRegion: Region;
  selectedKpi: KpiName;
}

const KpiChart: React.FC<KpiChartProps> = ({ data, selectedRegion, selectedKpi }) => {
  const kpiInfo = KPI_DEFINITIONS[selectedKpi];
  const filteredData = data.filter(d => d.region === selectedRegion && d.kpi === selectedKpi);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const isBelowTarget = kpiInfo.higherIsBetter ? dataPoint.value < kpiInfo.target : dataPoint.value > kpiInfo.target;
      return (
        <div className="bg-gray-700 p-3 rounded-md border border-gray-600 shadow-lg">
          <p className="font-bold text-gray-100">{`Week ${label}`}</p>
          <p className={`text-sm ${isBelowTarget ? 'text-red-400' : 'text-cyan-400'}`}>{`${selectedKpi}: ${payload[0].value} ${kpiInfo.unit}`}</p>
          <p className="text-sm text-gray-300">{`Target: ${kpiInfo.target} ${kpiInfo.unit}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-96">
      <h3 className="text-lg font-semibold mb-4 text-white">{`Weekly ${selectedKpi}: ${selectedRegion}`}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="week" stroke="#A0AEC0" tick={{ fill: '#A0AEC0' }} />
          <YAxis stroke="#A0AEC0" domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#A0AEC0' }} unit={kpiInfo.unit === '%' ? '%' : ''} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#E2E8F0' }} />
          <Line type="monotone" dataKey="value" stroke="#2DD4BF" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} name={selectedKpi} />
          <ReferenceLine y={kpiInfo.target} label={{ value: 'Target', position: 'insideTopLeft', fill: '#F56565' }} stroke="#F56565" strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default KpiChart;