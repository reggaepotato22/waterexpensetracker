import { useState } from "react";
import { MonthlyLog, MileageEntry } from "@/types/mileage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, CalendarDays, MapPin, DollarSign, ClipboardList, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface MonthlyHistoryProps {
  logs: Record<string, MonthlyLog>;
  onSelectDay?: (monthKey: string, date: string) => void;
  onDeleteDay?: (monthKey: string, date: string) => void;
}

interface DailyStats {
  date: string;
  jobs: number;
  paidJobs: number;
  distance: number;
  amount: number;
}

const buildDailyStats = (entries: MileageEntry[]): DailyStats[] => {
  const map = new Map<string, DailyStats>();

  entries.forEach((entry) => {
    const day = entry.date
      ? format(entry.date, "yyyy-MM-dd")
      : format(entry.timestamp, "yyyy-MM-dd");

    const current = map.get(day) || {
      date: day,
      jobs: 0,
      paidJobs: 0,
      distance: 0,
      amount: 0,
    };

    current.jobs += 1;
    if ((entry.amountPaid || 0) > 0) current.paidJobs += 1;
    current.distance += entry.distance || 0;
    current.amount += entry.amountPaid || 0;
    map.set(day, current);
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export const MonthlyHistory = ({ logs, onSelectDay, onDeleteDay }: MonthlyHistoryProps) => {
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const sortedMonths = Object.values(logs).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const handleDeleteDay = (e: React.MouseEvent, monthKey: string, date: string) => {
    e.stopPropagation();
    if (onDeleteDay) {
      if (confirm(`Are you sure you want to delete all entries for ${format(parseISO(date), "EEE, dd MMM yyyy")}?`)) {
        onDeleteDay(monthKey, date);
        toast.success(`Deleted entries for ${format(parseISO(date), "EEE, dd MMM yyyy")}`);
      }
    }
  };

  if (sortedMonths.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No history yet. Start adding jobs and fuel data to see monthly and daily stats here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedMonths.map((log) => {
        // Calculate total distance: endMileage - startMileage for the month
        let totalDistance = 0;
        if (log.startMileage !== null && log.endMileage !== null) {
          totalDistance = Math.max(0, log.endMileage - log.startMileage);
        } else {
          // Fallback to sum of entry distances if mileage not set
          totalDistance = log.entries.reduce((sum, e) => {
            let entryDistance = 0;
            if (e.distance && e.distance > 0) {
              entryDistance = e.distance;
            } else if (e.mileageStart !== null && e.mileageEnd !== null) {
              entryDistance = Math.max(0, e.mileageEnd - e.mileageStart);
            }
            return sum + entryDistance;
          }, 0);
        }
        
        const amountEarned =
          log.fuelData.amountEarned ??
          log.entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
        const paidJobs = log.entries.filter(
          (e) => (e.amountPaid || 0) > 0
        ).length;
        const monthLabel = format(
          parseISO(`${log.month}-01`),
          "MMMM yyyy"
        );
        const isOpen = openMonth === log.id;
        const dailyStats = isOpen ? buildDailyStats(log.entries) : [];

        return (
          <Card
            key={log.id}
            className="border-border bg-card overflow-hidden"
          >
            <CardHeader
              className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/60"
              onClick={() => setOpenMonth(isOpen ? null : log.id)}
            >
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  tabIndex={-1}
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    {monthLabel}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {log.totalJobs} jobs • {totalDistance.toLocaleString()} km
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <ClipboardList className="w-3 h-3 text-emerald-500" />
                  <span className="text-muted-foreground">Paid:</span>
                  <span className="font-semibold">{paidJobs}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-500" />
                  <span className="text-muted-foreground">Distance:</span>
                  <span className="font-semibold">
                    {totalDistance.toLocaleString()} km
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-amber-500" />
                  <span className="text-muted-foreground">Earned:</span>
                  <span className="font-semibold">
                    KES {amountEarned.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardHeader>

            {isOpen && (
              <CardContent className="border-t border-border/60 bg-muted/40">
                {dailyStats.length === 0 ? (
                  <p className="py-4 text-xs text-muted-foreground">
                    No daily entries for this month yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="text-left border-b border-border/60 bg-card/60">
                          <th className="py-2 pr-4 font-semibold">Date</th>
                          <th className="py-2 pr-4 font-semibold text-right">
                            Jobs
                          </th>
                          <th className="py-2 pr-4 font-semibold text-right">
                            Paid Jobs
                          </th>
                          <th className="py-2 pr-4 font-semibold text-right">
                            Distance (km)
                          </th>
                          <th className="py-2 pr-4 font-semibold text-right">
                            Amount (KES)
                          </th>
                          {onDeleteDay && (
                            <th className="py-2 pr-4 font-semibold text-center">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {dailyStats.map((d) => (
                          <tr
                            key={d.date}
                            className="border-b border-border/40 last:border-0 hover:bg-card/60 transition-colors"
                          >
                            <td 
                              className="py-1.5 pr-4 font-medium cursor-pointer"
                              onClick={() => onSelectDay?.(log.month, d.date)}
                            >
                              {format(parseISO(d.date), "EEE, dd MMM")}
                            </td>
                            <td 
                              className="py-1.5 pr-4 text-right cursor-pointer"
                              onClick={() => onSelectDay?.(log.month, d.date)}
                            >
                              {d.jobs}
                            </td>
                            <td 
                              className="py-1.5 pr-4 text-right cursor-pointer"
                              onClick={() => onSelectDay?.(log.month, d.date)}
                            >
                              {d.paidJobs}
                            </td>
                            <td 
                              className="py-1.5 pr-4 text-right cursor-pointer"
                              onClick={() => onSelectDay?.(log.month, d.date)}
                            >
                              {d.distance.toLocaleString()}
                            </td>
                            <td 
                              className="py-1.5 pr-4 text-right font-mono cursor-pointer"
                              onClick={() => onSelectDay?.(log.month, d.date)}
                            >
                              {d.amount.toLocaleString()}
                            </td>
                            {onDeleteDay && (
                              <td className="py-1.5 pr-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => handleDeleteDay(e, log.month, d.date)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default MonthlyHistory;


