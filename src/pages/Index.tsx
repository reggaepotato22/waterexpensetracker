import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import MessageParser from "@/components/MessageParser";
import MileageTable from "@/components/MileageTable";
import ExportPanel from "@/components/ExportPanel";
import QuickEntryForm from "@/components/QuickEntryForm";
import { useMileageEntries } from "@/hooks/useMileageEntries";
import { Toaster } from "sonner";

const Index = () => {
  const {
    entries,
    startMileage,
    setStartMileage,
    addEntry,
    addFromMessages,
    updateEntry,
    deleteEntry,
    clearEntries,
    getLastMileage,
  } = useMileageEntries();

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
            Paste WhatsApp messages, extract locations & mileage readings, and export to Google Sheets.
          </p>
        </div>

        {/* Stats */}
        <StatsCards entries={entries} startMileage={startMileage} />

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
            />
            <ExportPanel 
              entries={entries} 
              date={new Date()} 
              startMileage={startMileage} 
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
