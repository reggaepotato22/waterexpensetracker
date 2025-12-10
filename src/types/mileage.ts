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

export interface FuelData {
  fuelCf: number | null;
  dieselAmount: number | null;
  dieselCost: number | null;
  petrolAmount: number | null;
  petrolCost: number | null;
  totalLitersUsed: number | null;
  totalCost: number | null;
  totalExpense: number | null;
  fuelBalance: number | null;
  amountEarned: number | null;
}

export interface MonthlyLog {
  id: string;
  month: string; // Format: "YYYY-MM"
  startMileage: number | null;
  endMileage: number | null;
  totalJobs: number;
  totalDistance: number;
  entries: MileageEntry[];
  fuelData: FuelData;
}
