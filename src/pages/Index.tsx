import Header from '@/components/Header';
import MonthSelector from '@/components/MonthSelector';
import { MileageEntryForm } from '@/components/MileageEntryForm';
import FuelDataUploader from '@/components/FuelDataUploader';
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
    setMileage,
    setFuelData,
    setTotalJobs,
    addMisdemeanor,
    updateMisdemeanor,
    deleteMisdemeanor,
    isLoading,
  } = useMonthlyData();

  // Convert string month to Date for MonthSelector
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

        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="entry">Data Entry</TabsTrigger>
            <TabsTrigger value="fuel">Fuel & Expenses</TabsTrigger>
            <TabsTrigger value="misdemeanors">Misdemeanors</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="mt-6">
            <MileageEntryForm
              startMileage={currentLog.startMileage}
              endMileage={currentLog.endMileage}
              totalJobs={currentLog.totalJobs}
              onSave={(start, end, jobs) => {
                setMileage(start, end);
                setTotalJobs(jobs);
              }}
            />
          </TabsContent>

          <TabsContent value="fuel" className="mt-6">
            <FuelDataUploader
              fuelData={currentLog.fuelData}
              onFuelDataLoaded={setFuelData}
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
