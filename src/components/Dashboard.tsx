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
}

const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;

export const Dashboard = ({ entries, fuelData, totalDistance }: DashboardProps) => {
  const paidJobs = entries.filter((e) => (e.amountPaid || 0) > 0).length;
  const amountEarned =
    fuelData.amountEarned ??
    entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);

  const dieselCost = fuelData.dieselCost || 0;
  const petrolCost = fuelData.petrolCost || 0;
  const totalExpense = fuelData.totalExpense || 0;
  const otherCosts = fuelData.otherCosts || 0;

  const totalFuelCost = dieselCost + petrolCost;
  const fuelConsumptionRate = fuelData.fuelConsumptionRate || 0;
  const computedLitersUsed =
    fuelConsumptionRate > 0
      ? Number((totalDistance / fuelConsumptionRate).toFixed(2))
      : fuelData.totalLitersUsedDiesel || fuelData.totalLitersUsed || 0;

  const dieselUnitCost =
    fuelData.dieselAmount && fuelData.dieselAmount > 0
      ? dieselCost / fuelData.dieselAmount
      : 0;
  const usageCost = Number((computedLitersUsed * dieselUnitCost).toFixed(2));

  const netProfit =
    amountEarned -
    (usageCost + totalFuelCost + totalExpense + otherCosts);

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
      value: `${totalDistance.toLocaleString()} km`,
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

