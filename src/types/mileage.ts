export interface MileageEntry {
  id: string;
  jobNumber: number;
  start: string;
  end: string;
  mileageStart: number | null;
  mileageEnd: number | null;
  distance: number | null;
  totalDistance: number | null;
  amountPaid: number | null;
  imageUrl?: string;
  timestamp: Date;
  status: 'pending' | 'processed' | 'manual';
}

export interface DailyLog {
  id: string;
  date: Date;
  startMileage: number | null;
  entries: MileageEntry[];
}
