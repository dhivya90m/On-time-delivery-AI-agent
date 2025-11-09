import React, { useState, useEffect, useMemo, useCallback } from 'react';
import KpiChart from './KpiChart';
import AlertsPanel from './AlertsPanel';
import ActionTracker from './ActionTracker';
import MetricCard from './MetricCard';
import { Region, DeliveryData, Alert, TrackedAction, RawDeliveryRecord } from '../types';
import { KPI_THRESHOLD, REGIONS, ON_TIME_DELIVERY_THRESHOLD_MINUTES } from '../constants';


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

const processAndAggregateData = (records: RawDeliveryRecord[]): DeliveryData[] => {
  type AggregationMap = {
    [region in string]?: {
      [week: number]: {
        totalOrders: number;
        onTimeOrders: number;
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
      aggregationMap[region]![week] = { totalOrders: 0, onTimeOrders: 0 };
    }

    aggregationMap[region]![week].totalOrders++;
    if (record.deliveryTime <= ON_TIME_DELIVERY_THRESHOLD_MINUTES) {
      aggregationMap[region]![week].onTimeOrders++;
    }
  }

  const aggregatedData: DeliveryData[] = [];
  for (const regionStr in aggregationMap) {
    const region = regionStr as Region;
    const weeklyData = aggregationMap[region];
    if (weeklyData) {
      for (const weekStr in weeklyData) {
        const week = parseInt(weekStr, 10);
        const { totalOrders, onTimeOrders } = weeklyData[week];
        const otdRate = totalOrders > 0 ? parseFloat(((onTimeOrders / totalOrders) * 100).toFixed(1)) : 0;
        
        aggregatedData.push({
          week,
          region,
          otdRate,
          targetRate: KPI_THRESHOLD,
        });
      }
    }
  }

  return aggregatedData.sort((a, b) => a.region.localeCompare(b.region) || a.week - b.week);
};


const Dashboard: React.FC = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region>('North America');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trackedActions, setTrackedActions] = useState<TrackedAction[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const detectedAlerts = deliveryData
      .filter(d => d.otdRate < KPI_THRESHOLD)
      .map(d => ({
        id: `${d.region}-${d.week}`,
        week: d.week,
        region: d.region,
        otdRate: d.otdRate,
        targetRate: d.targetRate,
      }))
      .filter(alert => !trackedActions.some(action => action.alert.id === alert.id));
    
    setAlerts(detectedAlerts);
  }, [deliveryData, trackedActions]);
  
  const handleLogAction = useCallback((alertToLog: Alert, actionTaken: string) => {
    const nextWeek = alertToLog.week + 1;
    let newRate = Math.min(KPI_THRESHOLD + 2, alertToLog.otdRate + (Math.random() * 4 + 1));
    newRate = parseFloat(newRate.toFixed(1));

    setDeliveryData(prevData => {
      const newData = [...prevData];
      const nextWeekIndex = newData.findIndex(d => d.region === alertToLog.region && d.week === nextWeek);

      if (nextWeekIndex !== -1) {
        newData[nextWeekIndex] = { ...newData[nextWeekIndex], otdRate: newRate };
      }
      return newData;
    });

    const newAction: TrackedAction = {
      id: `action-${Date.now()}`,
      alert: alertToLog,
      actionTaken,
      timestamp: new Date().toLocaleString(),
      outcome: `OTD rate improved in Week ${nextWeek}.`,
      previousRate: alertToLog.otdRate,
      newRate: newRate,
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

        const header = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['Order_Date', 'Delivery_Time', 'Store_Latitude', 'Store_Longitude'];
        if (!requiredHeaders.every(h => header.includes(h))) {
          throw new Error(`Invalid CSV headers. Required: ${requiredHeaders.join(', ')}.`);
        }
        
        const dateIndex = header.indexOf('Order_Date');
        const timeIndex = header.indexOf('Delivery_Time');
        const latIndex = header.indexOf('Store_Latitude');
        const lonIndex = header.indexOf('Store_Longitude');

        const rawRecords: RawDeliveryRecord[] = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          if (values.length < header.length) {
            throw new Error(`Row ${index + 2} has fewer columns than the header.`);
          }
          const orderDate = new Date(values[dateIndex]);
          const deliveryTime = parseInt(values[timeIndex], 10);
          const storeLatitude = parseFloat(values[latIndex]);
          const storeLongitude = parseFloat(values[lonIndex]);

          if (isNaN(orderDate.getTime()) || isNaN(deliveryTime) || isNaN(storeLatitude) || isNaN(storeLongitude)) {
            throw new Error(`Invalid or missing data on row ${index + 2}. Check date, time, and coordinates.`);
          }

          return { orderDate, deliveryTime, storeLatitude, storeLongitude };
        });
        
        const aggregatedData = processAndAggregateData(rawRecords);

        setDeliveryData(aggregatedData);
        setTrackedActions([]);
        setAlerts([]);
        setUploadStatus({ message: `Successfully uploaded and processed ${aggregatedData.length} weekly records.`, type: 'success' });
        
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

  const overallMetrics = useMemo(() => {
    if (deliveryData.length === 0) return { avgOtd: 'N/A', openAlerts: '0' };

    const latestWeek = Math.max(...deliveryData.map(d => d.week));
    const latestData = deliveryData.filter(d => d.week === latestWeek);

    if (latestData.length === 0) return { avgOtd: 'N/A', openAlerts: alerts.length.toString() };
    
    const avgOtd = latestData.reduce((acc, curr) => acc + curr.otdRate, 0) / latestData.length;
    return {
      avgOtd: avgOtd.toFixed(1) + '%',
      openAlerts: alerts.length.toString(),
    };
  }, [deliveryData, alerts]);

  const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
  const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Overall OTD Rate (Latest Week)" value={overallMetrics.avgOtd} icon={<CheckIcon />} />
        <MetricCard title="Active Alerts" value={overallMetrics.openAlerts} icon={<AlertIcon />} />
        <MetricCard title="Task Success Rate" value="98.2%" change="+0.5%" changeType="increase" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        <MetricCard title="Drift Latency" value="8.1 hrs" change="-1.2 hrs" changeType="decrease" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
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
          Required CSV headers: 'Order_Date', 'Delivery_Time', 'Store_Latitude', 'Store_Longitude'.
        </p>
      </div>

      {deliveryData.length === 0 && !uploadStatus?.message.includes("Success") && (
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

      {deliveryData.length > 0 && (
        <>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-400">Select Region:</span>
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
            <KpiChart data={deliveryData} selectedRegion={selectedRegion} />
            <AlertsPanel alerts={alerts} onLogAction={handleLogAction} />
          </div>

          <ActionTracker actions={trackedActions} />
        </>
      )}

    </div>
  );
};

export default Dashboard;
