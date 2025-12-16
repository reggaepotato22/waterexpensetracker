import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyLog } from "@/types/mileage";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyAnalysisProps {
  currentLog: MonthlyLog;
}

type DailyAggregate = {
  date: string;
  distance: number;
  earnings: number;
  expenses: number;
  jobs: number;
};

const buildDailyAggregates = (log: MonthlyLog): DailyAggregate[] => {
  const map = new Map<string, DailyAggregate>();

  log.entries.forEach((entry) => {
    const date = entry.date
      ? entry.date.toISOString().split("T")[0]
      : entry.timestamp.toISOString().split("T")[0];
    const existing = map.get(date) || {
      date,
      distance: 0,
      earnings: 0,
      expenses: 0,
      jobs: 0,
    };
    existing.distance += entry.distance || 0;
    existing.earnings += entry.amountPaid || 0;
    existing.jobs += (entry.amountPaid || 0) > 0 ? 1 : 0;
    map.set(date, existing);
  });

  const expensePerDay =
    (log.fuelData.totalExpense || 0) /
    (map.size === 0 ? 1 : map.size);

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      expenses: expensePerDay,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const MonthlyAnalysis = ({ currentLog }: MonthlyAnalysisProps) => {
  const data = buildDailyAggregates(currentLog);

  const totalEarnings = data.reduce((s, d) => s + d.earnings, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
  const totalJobs = data.reduce((s, d) => s + d.jobs, 0);
  const bestDay = [...data].sort((a, b) => b.earnings - a.earnings)[0];
  const worstDay = [...data].sort((a, b) => a.earnings - b.earnings)[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              KES {totalEarnings.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              KES {totalExpenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Paid Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">{totalJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Avg Daily Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              KES {data.length ? Math.round(totalEarnings / data.length).toLocaleString() : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Daily Profit Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" name="Earnings" />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs vs Distance</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="jobs" fill="hsl(var(--primary))" name="Jobs" />
                <Bar dataKey="distance" fill="hsl(var(--chart-2))" name="Distance" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Best Day</CardTitle>
          </CardHeader>
          <CardContent>
            {bestDay ? (
              <div className="space-y-1">
                <p className="font-semibold">{bestDay.date}</p>
                <p className="text-sm text-muted-foreground">
                  Earnings: KES {bestDay.earnings.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Jobs: {bestDay.jobs} • Distance: {bestDay.distance} km
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lowest Day</CardTitle>
          </CardHeader>
          <CardContent>
            {worstDay ? (
              <div className="space-y-1">
                <p className="font-semibold">{worstDay.date}</p>
                <p className="text-sm text-muted-foreground">
                  Earnings: KES {worstDay.earnings.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Jobs: {worstDay.jobs} • Distance: {worstDay.distance} km
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonthlyAnalysis;

