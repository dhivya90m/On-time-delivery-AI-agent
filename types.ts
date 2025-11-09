export type Region = 'North America' | 'Europe' | 'Asia-Pacific' | 'South America' | 'Unclassified';

// This is the new type for raw CSV records
export interface RawDeliveryRecord {
  orderDate: Date;
  deliveryTime: number; // in minutes
  storeLatitude: number;
  storeLongitude: number;
}


export interface DeliveryData {
  week: number;
  region: Region;
  otdRate: number;
  targetRate: number;
}

export interface Alert {
  id: string;
  week: number;
  region: Region;
  otdRate: number;
  targetRate: number;
  recommendations?: string[];
}

export interface TrackedAction {
  id: string;
  alert: Alert;
  actionTaken: string;
  timestamp: string;
  outcome: string;
  previousRate: number;
  newRate: number;
}
