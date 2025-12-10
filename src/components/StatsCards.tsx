import { Car, MapPin, DollarSign, Image } from "lucide-react";
import { MileageEntry } from "@/types/mileage";

interface StatsCardsProps {
  entries: MileageEntry[];
  startMileage: number | null;
}

const StatsCards = ({ entries, startMileage }: StatsCardsProps) => {
  const totalJobs = entries.length;
  const totalDistance = entries.reduce((acc, e) => acc + (e.distance || 0), 0);
  const totalAmount = entries.reduce((acc, e) => acc + (e.amountPaid || 0), 0);
  const processedImages = entries.filter(e => e.status === 'processed').length;

  const stats = [
    {
      label: "Total Jobs",
      value: totalJobs,
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Distance (km)",
      value: totalDistance,
      icon: MapPin,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Amount Paid",
      value: `KES ${totalAmount.toLocaleString()}`,
      icon: DollarSign,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Images Processed",
      value: processedImages,
      icon: Image,
      color: "text-primary",
      bgColor: "bg-primary/10",
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
