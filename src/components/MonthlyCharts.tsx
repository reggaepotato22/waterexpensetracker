import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { MonthlyLog } from '@/types/mileage';
import { BarChart3 } from 'lucide-react';
import { format, parse } from 'date-fns';

interface MonthlyChartsProps {
  currentLog: MonthlyLog;
  allLogs: Record<string, MonthlyLog>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const MonthlyCharts = ({ currentLog, allLogs }: MonthlyChartsProps) => {
  // Fuel breakdown data for pie chart
  const fuelBreakdown = [
    { name: 'Diesel', value: currentLog.fuelData.dieselAmount || 0 },
    { name: 'Petrol', value: currentLog.fuelData.petrolAmount || 0 },
  ].filter(item => item.value > 0);

  // Cost breakdown for pie chart
  const costBreakdown = [
    { name: 'Diesel Cost', value: currentLog.fuelData.dieselCost || 0 },
    { name: 'Petrol Cost', value: currentLog.fuelData.petrolCost || 0 },
    { name: 'Other Expenses', value: (currentLog.fuelData.totalExpense || 0) - (currentLog.fuelData.totalCost || 0) },
  ].filter(item => item.value > 0);

  // Monthly trends (last 6 months)
  const monthlyTrends = Object.entries(allLogs)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, log]) => ({
      month: format(parse(month, 'yyyy-MM', new Date()), 'MMM'),
      distance: log.totalDistance || (log.endMileage && log.startMileage ? log.endMileage - log.startMileage : 0),
      jobs: log.totalJobs || 0,
      earned: log.fuelData.amountEarned || 0,
      expenses: log.fuelData.totalExpense || 0,
    }));

  // Current month stats
  const statsData = [
    { name: 'Distance (km)', value: currentLog.totalDistance || (currentLog.endMileage && currentLog.startMileage ? currentLog.endMileage - currentLog.startMileage : 0) },
    { name: 'Jobs', value: currentLog.totalJobs || 0 },
    { name: 'Earned', value: currentLog.fuelData.amountEarned || 0 },
    { name: 'Expenses', value: currentLog.fuelData.totalExpense || 0 },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Month Stats Bar Chart */}
            <div className="h-[300px]">
              <h4 className="text-sm font-medium mb-4 text-muted-foreground">Current Month Stats</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Fuel Breakdown Pie Chart */}
            <div className="h-[300px]">
              <h4 className="text-sm font-medium mb-4 text-muted-foreground">Fuel Consumption</h4>
              {fuelBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fuelBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}L`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {fuelBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No fuel data available
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trends Over Time */}
      {monthlyTrends.length > 1 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distance & Jobs Trend */}
              <div className="h-[300px]">
                <h4 className="text-sm font-medium mb-4 text-muted-foreground">Distance & Jobs</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="distance" name="Distance (km)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="jobs" name="Jobs" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Earnings vs Expenses Line Chart */}
              <div className="h-[300px]">
                <h4 className="text-sm font-medium mb-4 text-muted-foreground">Earnings vs Expenses</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="earned" name="Earned" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-3))' }} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ fill: 'hsl(var(--destructive))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      {costBreakdown.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {costBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
