import { Region, KpiName } from './types';

export const KPI_DEFINITIONS: Record<KpiName, { unit: string; target: number, higherIsBetter: boolean }> = {
  'On-Time Delivery': {
    unit: '%',
    target: 95.0,
    higherIsBetter: true,
  },
  'Order Accuracy': {
    unit: '%',
    target: 98.0,
    higherIsBetter: true,
  },
  'Customer Satisfaction': {
    unit: 'avg score',
    target: 4.5,
    higherIsBetter: true,
  },
  'Average Agent Rating': {
    unit: 'avg rating',
    target: 4.5,
    higherIsBetter: true,
  },
  'Order Prep Time': {
    unit: 'minutes',
    target: 15.0,
    higherIsBetter: false,
  }
};


export const ON_TIME_DELIVERY_THRESHOLD_MINUTES = 120;

export const REGIONS: Region[] = ['North America', 'Europe', 'Asia-Pacific', 'South America'];
export const KPIS: KpiName[] = ['On-Time Delivery', 'Order Accuracy', 'Customer Satisfaction', 'Average Agent Rating', 'Order Prep Time'];