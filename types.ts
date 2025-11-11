export type Region = 'North America' | 'Europe' | 'Asia-Pacific' | 'South America' | 'Unclassified';
export type KpiName = 'On-Time Delivery' | 'Order Accuracy' | 'Customer Satisfaction' | 'Average Agent Rating' | 'Order Prep Time';


// This is the new type for raw CSV records
export interface RawDeliveryRecord {
  orderDate: Date;
  deliveryTime: number; // in minutes
  orderAccurate: boolean;
  customerSatisfaction: number; // 1-5
  storeLatitude: number;
  storeLongitude: number;
  agentRating: number;
  orderTime: string;
  pickupTime: string;
}


export interface KpiData {
  week: number;
  region: Region;
  kpi: KpiName;
  value: number;
  target: number;
}

export interface Alert {
  id: string;
  week: number;
  region: Region;
  kpi: KpiName;
  value: number;
  targetRate: number;
}

export interface TrackedAction {
  id: string;
  alert: Alert;
  actionTaken: string;
  timestamp: string;
  outcome: string;
  previousValue: number;
  newValue: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
