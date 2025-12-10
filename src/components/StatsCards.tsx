import { Car, MapPin, DollarSign, Fuel } from "lucide-react";
import { MileageEntry, FuelData } from "@/types/mileage";

interface StatsCardsProps {
  entries: MileageEntry[];
  startMileage: number | null;
  fuelData: FuelData;
}

const StatsCards = ({ entries, startMileage, fuelData }: StatsCardsProps) => {
  const totalJobs = entries.length;
  const totalDistance = entries.reduce((acc, e) => acc + (e.distance || 0), 0);
  const amountEarned = fuelData.amountEarned || 0;
  const totalFuelCost = fuelData.totalCost || 0;

  const stats = [
    {
      label: "Total Jobs",
      value: totalJobs,
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Total Distance",
      value: `${totalDistance.toLocaleString()} km`,
      icon: MapPin,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Amount Earned",
      value: `KES ${amountEarned.toLocaleString()}`,
      icon: DollarSign,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Fuel Cost",
      value: `KES ${totalFuelCost.toLocaleString()}`,
      icon: Fuel,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="glass-card p-4 animate-slide-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-semibold text-foreground font-mono">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
