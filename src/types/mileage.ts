export interface MileageEntry {
  id: string;
  jobNumber: number;
  orderNumber?: string;
  customer?: string;
  start: string;
  end: string;
  mileageStart: number | null;
  mileageEnd: number | null;
  distance: number | null;
  totalDistance: number | null;
  amountPaid: number | null;
  isWaterFill: boolean;
  isParking: boolean;
  date?: Date;
  timestamp: Date;
  status: 'pending' | 'processed' | 'manual';
}

export interface Misdemeanor {
  id: string;
  date: Date;
  type: string;
  description: string;
  fine: number | null;
  resolved: boolean;
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
  fuelConsumptionRate?: number | null;
  otherCosts?: number | null;
  netProfit?: number | null;
  totalLitersUsedDiesel?: number | null;
  monthlySalary?: number | null; // Monthly salary for two lorry drivers
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
  misdemeanors: Misdemeanor[];
}

export interface WaterFillSite {
  id: string;
  name: string;
}

export interface CSVDelivery {
  key: string;
  orderNumber: string;
  date: string;
  customer: string;
  volume: number;
  earning: number;
}
