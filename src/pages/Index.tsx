import Header from '@/components/Header';
import MonthSelector from '@/components/MonthSelector';
import { JobEntryTable } from '@/components/JobEntryTable';
import { FuelExpenseForm } from '@/components/FuelExpenseForm';
import { MisdemeanorEntry } from '@/components/MisdemeanorEntry';
import StatsCards from '@/components/StatsCards';
import { MonthlyCharts } from '@/components/MonthlyCharts';
import { useMonthlyData } from '@/hooks/useMonthlyData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parse, format } from 'date-fns';

const Index = () => {
  const {
    currentMonth,
    setCurrentMonth,
    currentLog,
    setFuelData,
    addEntry,
    updateEntry,
    deleteEntry,
    setStartMileage,
    addMisdemeanor,
    updateMisdemeanor,
    deleteMisdemeanor,
    isLoading,
  } = useMonthlyData();

  const selectedDate = parse(currentMonth, 'yyyy-MM', new Date());
  const handleMonthChange = (date: Date) => {
    setCurrentMonth(format(date, 'yyyy-MM'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <MonthSelector 
          selectedMonth={selectedDate} 
          onMonthChange={handleMonthChange} 
        />

        <StatsCards 
          entries={currentLog.entries} 
          startMileage={currentLog.startMileage} 
          fuelData={currentLog.fuelData} 
        />

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="jobs">Job Entries</TabsTrigger>
            <TabsTrigger value="fuel">Fuel & Expenses</TabsTrigger>
            <TabsTrigger value="misdemeanors">Misdemeanors</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-6">
            <JobEntryTable
              entries={currentLog.entries}
              startMileage={currentLog.startMileage}
              onAddEntry={(entry) => addEntry({
                start: entry.start,
                end: entry.end,
                mileageStart: entry.mileageStart || 0,
                mileageEnd: entry.mileageEnd || 0,
                amountPaid: entry.amountPaid,
              })}
              onUpdateEntry={updateEntry}
              onDeleteEntry={deleteEntry}
              onSetStartMileage={setStartMileage}
            />
          </TabsContent>

          <TabsContent value="fuel" className="mt-6">
            <FuelExpenseForm
              fuelData={currentLog.fuelData}
              onSave={setFuelData}
            />
          </TabsContent>

          <TabsContent value="misdemeanors" className="mt-6">
            <MisdemeanorEntry
              misdemeanors={currentLog.misdemeanors || []}
              onAdd={addMisdemeanor}
              onUpdate={updateMisdemeanor}
              onDelete={deleteMisdemeanor}
            />
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <MonthlyCharts 
              currentLog={currentLog} 
              allLogs={{ [currentMonth]: currentLog }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
