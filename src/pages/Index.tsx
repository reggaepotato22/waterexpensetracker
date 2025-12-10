import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import MessageParser from "@/components/MessageParser";
import MileageTable from "@/components/MileageTable";
import ExportPanel from "@/components/ExportPanel";
import QuickEntryForm from "@/components/QuickEntryForm";
import FuelDataUploader from "@/components/FuelDataUploader";
import MonthSelector from "@/components/MonthSelector";
import { useMonthlyData } from "@/hooks/useMonthlyData";
import { Toaster } from "sonner";

const Index = () => {
  const {
    selectedMonth,
    setSelectedMonth,
    entries,
    startMileage,
    totalJobs,
    totalDistance,
    fuelData,
    setStartMileage,
    addEntry,
    addFromMessages,
    updateEntry,
    deleteEntry,
    clearEntries,
    setFuelData,
    getLastMileage,
  } = useMonthlyData();

  return (
    <div className="min-h-screen bg-background">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'hsl(222 47% 8%)',
            border: '1px solid hsl(222 30% 18%)',
            color: 'hsl(210 40% 98%)',
          },
        }}
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-bold">
            <span className="gradient-text">WhatsApp Mileage</span>
            <span className="text-foreground"> Scanner</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Track monthly mileage, fuel costs, and export to Google Sheets.
          </p>
        </div>

        {/* Month Selector */}
        <MonthSelector 
          selectedMonth={selectedMonth} 
          onMonthChange={setSelectedMonth} 
        />

        {/* Stats */}
        <StatsCards entries={entries} startMileage={startMileage} fuelData={fuelData} />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Parser & Quick Entry */}
          <div className="space-y-4">
            <MessageParser onMessagesParsed={addFromMessages} />
            <QuickEntryForm 
              onAddEntry={addEntry} 
              lastMileage={getLastMileage()}
              startMileage={startMileage}
              onStartMileageChange={setStartMileage}
              totalJobs={totalJobs}
              totalDistance={totalDistance}
            />
            <FuelDataUploader 
              onFuelDataLoaded={setFuelData}
              fuelData={fuelData}
            />
            <ExportPanel 
              entries={entries} 
              date={selectedMonth} 
              startMileage={startMileage}
              fuelData={fuelData}
            />
          </div>

          {/* Right Column - Table */}
          <div className="lg:col-span-2">
            <MileageTable 
              entries={entries}
              onUpdateEntry={updateEntry}
              onDeleteEntry={deleteEntry}
              onClearAll={clearEntries}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
