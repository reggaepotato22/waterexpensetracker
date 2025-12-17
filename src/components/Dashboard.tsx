import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MileageEntry, FuelData } from "@/types/mileage";
import {
  Fuel,
  Gauge,
  MapPin,
  TrendingUp,
  Wallet2,
  ClipboardList,
} from "lucide-react";

interface DashboardProps {
  entries: MileageEntry[];
  fuelData: FuelData;
  totalDistance: number;
  startMileage?: number | null;
  endMileage?: number | null;
}

const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;

export const Dashboard = ({ entries, fuelData, totalDistance, startMileage, endMileage }: DashboardProps) => {
  // Calculate totals from ALL entries for the month (ensuring daily entries are summed)
  const monthlyTotals = useMemo(() => {
    // Calculate total distance: use endMileage - startMileage for the month (most accurate)
    // Fallback to sum of entry distances if mileage not available
    let calculatedTotalDistance = 0;
    if (startMileage !== null && startMileage !== undefined && 
        endMileage !== null && endMileage !== undefined) {
      calculatedTotalDistance = Math.max(0, endMileage - startMileage);
    } else {
      // Fallback: calculate from entries
      calculatedTotalDistance = entries.reduce((sum, e) => {
        let entryDistance = 0;
        if (e.distance && e.distance > 0) {
          entryDistance = e.distance;
        } else if (e.mileageStart !== null && e.mileageEnd !== null) {
          entryDistance = Math.max(0, e.mileageEnd - e.mileageStart);
        }
        return sum + entryDistance;
      }, 0);
    }
    
    // Calculate total earnings from all entries (always use sum of entries for accuracy)
    const calculatedAmountEarned = entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
    
    // Count paid jobs from all entries
    const calculatedPaidJobs = entries.filter((e) => (e.amountPaid || 0) > 0).length;
    
    return {
      totalDistance: calculatedTotalDistance,
      amountEarned: calculatedAmountEarned,
      paidJobs: calculatedPaidJobs,
    };
  }, [entries, startMileage, endMileage]);

  // Use calculated values from entries (more accurate than stored values)
  const paidJobs = monthlyTotals.paidJobs;
  const amountEarned = monthlyTotals.amountEarned;
  // Use calculated total distance (endMileage - startMileage is most accurate)
  const effectiveTotalDistance = monthlyTotals.totalDistance;

  // Aggregate fuel and expense data for the month
  const dieselCost = fuelData.dieselCost || 0;
  const petrolCost = fuelData.petrolCost || 0;
  const totalExpense = fuelData.totalExpense || 0;
  const otherCosts = fuelData.otherCosts || 0;
  const monthlySalary = fuelData.monthlySalary || 0; // Monthly salary for two lorry drivers

  const totalFuelCost = dieselCost + petrolCost;
  const fuelConsumptionRate = fuelData.fuelConsumptionRate || 0;
  
  // Calculate liters used for the ENTIRE MONTH based on total monthly distance
  // Always prioritize calculation from monthly distance over manually entered values
  let computedLitersUsed = 0;
  if (fuelConsumptionRate > 0 && effectiveTotalDistance > 0) {
    // Calculate from monthly total distance (most accurate for entire month)
    computedLitersUsed = Number((effectiveTotalDistance / fuelConsumptionRate).toFixed(2));
  } else if (fuelData.totalLitersUsedDiesel && fuelData.totalLitersUsedDiesel > 0) {
    // Fallback to manually entered value only if calculation not possible
    computedLitersUsed = fuelData.totalLitersUsedDiesel;
  } else if (fuelData.totalLitersUsed && fuelData.totalLitersUsed > 0) {
    // Last fallback
    computedLitersUsed = fuelData.totalLitersUsed;
  }
  // Ensure computedLitersUsed is never negative
  computedLitersUsed = Math.max(0, computedLitersUsed);

  // Calculate diesel unit cost and usage cost
  const dieselUnitCost =
    fuelData.dieselAmount && fuelData.dieselAmount > 0
      ? dieselCost / fuelData.dieselAmount
      : 0;
  const usageCost = Number((computedLitersUsed * dieselUnitCost).toFixed(2));

  // Calculate net profit: total earnings minus all costs including monthly salary
  const netProfit =
    amountEarned -
    (usageCost + totalFuelCost + totalExpense + otherCosts + monthlySalary);

  const cards = [
    {
      label: "Net Profit",
      value: formatCurrency(netProfit),
      icon: Wallet2,
      accent: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Monthly Earnings",
      value: formatCurrency(amountEarned),
      icon: TrendingUp,
      accent: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Paid Jobs",
      value: paidJobs,
      icon: ClipboardList,
      accent: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Monthly Distance",
      value: `${effectiveTotalDistance.toLocaleString()} km`,
      icon: MapPin,
      accent: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Total Liters Used - Diesel",
      value: `${computedLitersUsed.toLocaleString()} L`,
      icon: Gauge,
      accent: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Total Fuel Cost",
      value: formatCurrency(totalFuelCost),
      icon: Fuel,
      accent: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, idx) => (
        <Card
          key={card.label}
          className="glass-card animate-slide-up"
          style={{ animationDelay: `${idx * 0.05}s` }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.accent}`} />
              </span>
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground font-mono">
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Dashboard;

