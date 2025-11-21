import React, { useState, useEffect, useMemo, useCallback } from 'react';
import KpiChart from './KpiChart';
import AlertsPanel from './AlertsPanel';
import ActionTracker from './ActionTracker';
import MetricCard from './MetricCard';
import Playground from './Playground';
import ExecutiveBrief from './ExecutiveBrief';
import { Region, KpiData, Alert, TrackedAction, RawDeliveryRecord, KpiName, ChatMessage } from '../types';
import { KPI_DEFINITIONS, REGIONS, ON_TIME_DELIVERY_THRESHOLD_MINUTES } from '../constants';
import { getConversationalInsight } from '../services/geminiService';


// Helper Functions for Data Processing
const getWeekNumber = (d: Date): number => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

const getRegionFromCoordinates = (lat: number, lon: number): Region => {
  if (lat > 25 && lon < -50) return 'North America';
  if (lat < 10 && lon < -30) return 'South America';
  if (lat > 35 && lon > -10 && lon < 40) return 'Europe';
  if (lat > -10 && lon > 40) return 'Asia-Pacific';
  return 'Unclassified';
};

const processAndAggregateData = (records: RawDeliveryRecord[], availableKpis: KpiName[]): KpiData[] => {
  type AggregationMap = {
    [region in string]?: {
      [week: number]: {
        totalOrders: number;
        onTimeOrders: number;
        accurateOrders: number;
        satisfactionSum: number;
        satisfactionCount: number;
        ratingSum: number;
        ratingCount: number;
        prepTimeSum: number;
        prepTimeCount: number;
      };
    };
  };

  const aggregationMap: AggregationMap = {};

  for (const record of records) {
    const region = getRegionFromCoordinates(record.storeLatitude, record.storeLongitude);
    if (region === 'Unclassified') continue;

    const week = getWeekNumber(record.orderDate);

    if (!aggregationMap[region]) {
      aggregationMap[region] = {};
    }
    if (!aggregationMap[region]![week]) {
      aggregationMap[region]![week] = { totalOrders: 0, onTimeOrders: 0, accurateOrders: 0, satisfactionSum: 0, satisfactionCount: 0, ratingSum: 0, ratingCount: 0, prepTimeSum: 0, prepTimeCount: 0 };
    }
    const weeklyAgg = aggregationMap[region]![week];

    weeklyAgg.totalOrders++;
    if (record.deliveryTime <= ON_TIME_DELIVERY_THRESHOLD_MINUTES) {
      weeklyAgg.onTimeOrders++;
    }
    if (record.orderAccurate) {
      weeklyAgg.accurateOrders++;
    }
    if (record.customerSatisfaction > 0) {
      weeklyAgg.satisfactionSum += record.customerSatisfaction;
      weeklyAgg.satisfactionCount++;
    }
    if (record.agentRating > 0) {
      weeklyAgg.ratingSum += record.agentRating;
      weeklyAgg.ratingCount++;
    }
    if (record.orderTime && record.pickupTime) {
      try {
        const orderDateTime = new Date(`${record.orderDate.toDateString()} ${record.orderTime}`);
        const pickupDateTime = new Date(`${record.orderDate.toDateString()} ${record.pickupTime}`);
        if (pickupDateTime > orderDateTime) {
          const prepTimeMinutes = (pickupDateTime.getTime() - orderDateTime.getTime()) / (1000 * 60);
          weeklyAgg.prepTimeSum += prepTimeMinutes;
          weeklyAgg.prepTimeCount++;
        }
      } catch (e) {
        console.warn('Could not parse order/pickup time', e);
      }
    }
  }

  const aggregatedData: KpiData[] = [];
  for (const regionStr in aggregationMap) {
    const region = regionStr as Region;
    const weeklyData = aggregationMap[region];
    if (weeklyData) {
      for (const weekStr in weeklyData) {
        const week = parseInt(weekStr, 10);
        const agg = weeklyData[week];
        
        if (availableKpis.includes('On-Time Delivery')) {
            const otdRate = agg.totalOrders > 0 ? parseFloat(((agg.onTimeOrders / agg.totalOrders) * 100).toFixed(1)) : 0;
            aggregatedData.push({ week, region, kpi: 'On-Time Delivery', value: otdRate, target: KPI_DEFINITIONS['On-Time Delivery'].target });
        }
        if (availableKpis.includes('Order Accuracy')) {
            const accuracyRate = agg.totalOrders > 0 ? parseFloat(((agg.accurateOrders / agg.totalOrders) * 100).toFixed(1)) : 0;
            aggregatedData.push({ week, region, kpi: 'Order Accuracy', value: accuracyRate, target: KPI_DEFINITIONS['Order Accuracy'].target });
        }
        if (availableKpis.includes('Customer Satisfaction')) {
            const satisfactionAvg = agg.satisfactionCount > 0 ? parseFloat((agg.satisfactionSum / agg.satisfactionCount).toFixed(2)) : 0;
            if (satisfactionAvg > 0) {
                aggregatedData.push({ week, region, kpi: 'Customer Satisfaction', value: satisfactionAvg, target: KPI_DEFINITIONS['Customer Satisfaction'].target });
            }
        }
        if (availableKpis.includes('Average Agent Rating')) {
            const ratingAvg = agg.ratingCount > 0 ? parseFloat((agg.ratingSum / agg.ratingCount).toFixed(2)) : 0;
            if (ratingAvg > 0) {
                aggregatedData.push({ week, region, kpi: 'Average Agent Rating', value: ratingAvg, target: KPI_DEFINITIONS['Average Agent Rating'].target });
            }
        }
        if (availableKpis.includes('Order Prep Time')) {
            const prepTimeAvg = agg.prepTimeCount > 0 ? parseFloat((agg.prepTimeSum / agg.prepTimeCount).toFixed(1)) : 0;
            if (prepTimeAvg > 0) {
                aggregatedData.push({ week, region, kpi: 'Order Prep Time', value: prepTimeAvg, target: KPI_DEFINITIONS['Order Prep Time'].target });
            }
        }
      }
    }
  }

  return aggregatedData.sort((a, b) => a.region.localeCompare(b.region) || a.kpi.localeCompare(b.kpi) || a.week - b.week);
};


const Dashboard: React.FC = () => {
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region>('North America');
  const [selectedKpi, setSelectedKpi] = useState<KpiName>('On-Time Delivery');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trackedActions, setTrackedActions] = useState<TrackedAction[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [availableKpis, setAvailableKpis] = useState<KpiName[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  useEffect(() => {
    const detectedAlerts = kpiData
      .filter(d => {
        const kpiInfo = KPI_DEFINITIONS[d.kpi];
        return kpiInfo.higherIsBetter ? d.value < d.target : d.value > d.target;
      })
      .map(d => ({
        id: `${d.kpi}-${d.region}-${d.week}`,
        week: d.week,
        region: d.region,
        kpi: d.kpi,
        value: d.value,
        targetRate: d.target,
      }))
      .filter(alert => !trackedActions.some(action => action.alert.id === alert.id));
    
    setAlerts(detectedAlerts);
  }, [kpiData, trackedActions]);

  useEffect(() => {
    if (availableKpis.length > 0 && !availableKpis.includes(selectedKpi)) {
      setSelectedKpi(availableKpis[0]);
    }
  }, [availableKpis, selectedKpi]);
  
  const handleLogAction = useCallback((alertToLog: Alert, actionTaken: string) => {
    const nextWeek = alertToLog.week + 1;
    const kpiInfo = KPI_DEFINITIONS[alertToLog.kpi];
    let improvement;

    if (alertToLog.kpi === 'Customer Satisfaction' || alertToLog.kpi === 'Average Agent Rating') {
        improvement = (Math.random() * 0.4 + 0.1);
    } else if (alertToLog.kpi === 'Order Prep Time') {
        improvement = -(Math.random() * 2 + 1); // Negative improvement
    } else { // Percentage based
        improvement = (Math.random() * 4 + 1);
    }
    
    let newValue = kpiInfo.higherIsBetter 
      ? Math.min(kpiInfo.unit === '%' ? 100 : 5, alertToLog.value + improvement)
      : Math.max(0, alertToLog.value + improvement);

    newValue = parseFloat(newValue.toFixed(kpiInfo.unit === '%' ? 1 : 2));

    
    setKpiData(prevData => {
      const newData = [...prevData];
      const nextWeekIndex = newData.findIndex(d => d.region === alertToLog.region && d.kpi === alertToLog.kpi && d.week === nextWeek);

      if (nextWeekIndex !== -1) {
        newData[nextWeekIndex] = { ...newData[nextWeekIndex], value: newValue };
      }
      return newData;
    });

    const newAction: TrackedAction = {
      id: `action-${Date.now()}`,
      alert: alertToLog,
      actionTaken,
      timestamp: new Date().toLocaleString(),
      outcome: `${alertToLog.kpi} improved in Week ${nextWeek}.`,
      previousValue: alertToLog.value,
      newValue: newValue,
    };
    setTrackedActions(prev => [newAction, ...prev]);

  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setUploadStatus(null);
    }
  };

  const handleFileUpload = useCallback(() => {
    if (!selectedFile) {
      setUploadStatus({ message: 'Please select a file first.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        if (!csv) throw new Error('File is empty or could not be read.');

        const lines = csv.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error('CSV file must contain a header and at least one data row.');

        const header = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
        
        const coreRequiredHeaders = ['order_date', 'delivery_time', 'store_latitude', 'store_longitude'];
        const missingCoreHeaders = coreRequiredHeaders.filter(key => !header.includes(key));
        if (missingCoreHeaders.length > 0) {
            throw new Error(`Invalid or missing core CSV headers. Required: ${missingCoreHeaders.join(', ')}.`);
        }
        
        const processedKpis: KpiName[] = ['On-Time Delivery'];
        if (header.includes('order_accurate')) processedKpis.push('Order Accuracy');
        if (header.includes('customer_satisfaction')) processedKpis.push('Customer Satisfaction');
        if (header.includes('agent_rating')) processedKpis.push('Average Agent Rating');
        if (header.includes('order_time') && header.includes('pickup_time')) processedKpis.push('Order Prep Time');

        
        const getIndex = (key: string) => header.indexOf(key);
        const dateIndex = getIndex('order_date');
        const timeIndex = getIndex('delivery_time');
        const latIndex = getIndex('store_latitude');
        const lonIndex = getIndex('store_longitude');
        const accIndex = getIndex('order_accurate');
        const satIndex = getIndex('customer_satisfaction');
        const ratingIndex = getIndex('agent_rating');
        const orderTimeIndex = getIndex('order_time');
        const pickupTimeIndex = getIndex('pickup_time');


        const rawRecords: RawDeliveryRecord[] = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          if (values.length < header.length) {
              console.warn(`Row ${index + 2} has fewer columns (${values.length}) than the header (${header.length}). It may be skipped or processed incorrectly.`);
          }
          const orderDate = new Date(values[dateIndex]);
          const deliveryTime = parseInt(values[timeIndex], 10);
          const storeLatitude = parseFloat(values[latIndex]);
          const storeLongitude = parseFloat(values[lonIndex]);
          
          const orderAccurate = accIndex !== -1 ? values[accIndex]?.toUpperCase() === 'TRUE' : false;
          const customerSatisfaction = satIndex !== -1 ? parseInt(values[satIndex], 10) : 0;
          const agentRating = ratingIndex !== -1 ? parseFloat(values[ratingIndex]) : 0;
          const orderTime = orderTimeIndex !== -1 ? values[orderTimeIndex] : '';
          const pickupTime = pickupTimeIndex !== -1 ? values[pickupTimeIndex] : '';


          if (isNaN(orderDate.getTime()) || isNaN(deliveryTime) || isNaN(storeLatitude) || isNaN(storeLongitude)) {
            throw new Error(`Invalid or missing core data on row ${index + 2}. Check date, time, and coordinate columns.`);
          }

          return { orderDate, deliveryTime, storeLatitude, storeLongitude, orderAccurate, customerSatisfaction, agentRating, orderTime, pickupTime };
        });
        
        const aggregatedData = processAndAggregateData(rawRecords, processedKpis);

        setKpiData(aggregatedData);
        setAvailableKpis(processedKpis);
        setTrackedActions([]);
        setAlerts([]);
        setChatMessages([]);
        setUploadStatus({ message: `Successfully processed ${rawRecords.length} records. Available KPIs: ${processedKpis.join(', ')}.`, type: 'success' });
        
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        setSelectedFile(null);

      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred during file processing.';
        setUploadStatus({ message, type: 'error' });
      }
    };

    reader.onerror = () => {
      setUploadStatus({ message: 'Failed to read the file.', type: 'error' });
    };

    reader.readAsText(selectedFile);
  }, [selectedFile]);

  const getLatestKpiValue = useCallback((kpiName: KpiName) => {
    if (kpiData.length === 0 || !availableKpis.includes(kpiName)) return { value: 'N/A', unit: KPI_DEFINITIONS[kpiName]?.unit || '' };

    const kpiInfo = KPI_DEFINITIONS[kpiName];
    const latestWeek = Math.max(...kpiData.map(d => d.week));
    const latestData = kpiData.filter(d => d.week === latestWeek && d.kpi === kpiName);

    if (latestData.length === 0) return { value: 'N/A', unit: kpiInfo.unit };
    
    const avgValue = latestData.reduce((acc, curr) => acc + curr.value, 0) / latestData.length;
    const valueString = `${avgValue.toFixed(1)}${kpiInfo.unit === '%' ? '%' : ''}`;
    
    return { value: valueString, unit: kpiInfo.unit };
  }, [kpiData, availableKpis]);

  const overallMetrics = useMemo(() => {
    return {
      selectedKpi: getLatestKpiValue(selectedKpi),
      agentRating: getLatestKpiValue('Average Agent Rating'),
      prepTime: getLatestKpiValue('Order Prep Time'),
      openAlerts: alerts.length.toString()
    };
  }, [getLatestKpiValue, selectedKpi, alerts.length]);

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!kpiData || kpiData.length === 0) return;

    const newUserMessage: ChatMessage = { role: 'user', content: prompt };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);

    try {
      const response = await getConversationalInsight(prompt, kpiData);
      const modelMessage: ChatMessage = { role: 'model', content: response };
      setChatMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  }, [kpiData]);

  const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
  const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
  const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title={`Overall ${selectedKpi}`} value={overallMetrics.selectedKpi.value} icon={<ChartIcon />} />
        <MetricCard title="Active Alerts" value={overallMetrics.openAlerts} icon={<AlertIcon />} />
        {availableKpis.includes('Average Agent Rating') && <MetricCard title="Avg. Agent Rating" value={`${overallMetrics.agentRating.value} / 5`} icon={<StarIcon />} />}
        {availableKpis.includes('Order Prep Time') && <MetricCard title="Avg. Prep Time" value={`${overallMetrics.prepTime.value} ${overallMetrics.prepTime.unit}`} icon={<ClockIcon />} />}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-white">Upload New Delivery Data (CSV)</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label htmlFor="csv-upload" className="w-full sm:w-auto text-center cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-200">
            Choose File
          </label>
          <input
            id="csv-upload"
            type="file"
            className="hidden"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            aria-label="Upload CSV file for delivery data"
          />
          <span className="text-gray-400 flex-grow text-center sm:text-left">{selectedFile ? selectedFile.name : 'No file chosen'}</span>
          <button
            onClick={handleFileUpload}
            disabled={!selectedFile}
            className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload & Process
          </button>
        </div>
        {uploadStatus && (
          <p className={`mt-4 text-sm font-medium ${uploadStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`} role="alert">
            {uploadStatus.message}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-bold">Required headers:</span> 'Order_Date', 'Delivery_Time', 'Store_Latitude', 'Store_Longitude'.
          <br/>
          <span className="font-bold">Optional headers for more KPIs:</span> 'Order_Accurate', 'Customer_Satisfaction', 'Agent_Rating', 'Order_Time', 'Pickup_Time'.
        </p>
      </div>

      {kpiData.length === 0 && !uploadStatus?.message.includes("Success") && (
        <div className="text-center p-10 bg-gray-800 rounded-lg shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l5-5m0 0l-5-5m5 5H7" />
          </svg>
          <h3 className="mt-2 text-lg font-semibold text-white">Awaiting Data</h3>
          <p className="mt-1 text-sm text-gray-400">
            Please upload a delivery data CSV file to begin the analysis.
          </p>
        </div>
      )}

      {kpiData.length > 0 && (
        <>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-400 min-w-24">Select KPI:</span>
              {availableKpis.map(kpi => (
                <button
                  key={kpi}
                  onClick={() => setSelectedKpi(kpi)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                    selectedKpi === kpi 
                    ? 'bg-cyan-600 text-white shadow-md' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {kpi}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-400 min-w-24">Select Region:</span>
              {REGIONS.map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                    selectedRegion === region 
                    ? 'bg-cyan-600 text-white shadow-md' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KpiChart data={kpiData} selectedRegion={selectedRegion} selectedKpi={selectedKpi} />
            <AlertsPanel alerts={alerts} onLogAction={handleLogAction} />
          </div>

          <ActionTracker actions={trackedActions} />

          {/* Executive Brief placed before Playground to prioritize high-level summary */}
          <ExecutiveBrief data={kpiData} alerts={alerts} />

          <Playground 
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
          />
        </>
      )}

    </div>
  );
};

export default Dashboard;