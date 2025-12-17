import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import MonthSelector from '@/components/MonthSelector';
import { JobEntryTable } from '@/components/JobEntryTable';
import { FuelExpenseForm } from '@/components/FuelExpenseForm';
import { MisdemeanorEntry } from '@/components/MisdemeanorEntry';
import { WaterFillSites } from '@/components/WaterFillSites';
import ExportPanel from '@/components/ExportPanel';
import Dashboard from '@/components/Dashboard';
import { MonthlyCharts } from '@/components/MonthlyCharts';
import { MonthlyAnalysis } from '@/components/MonthlyAnalysis';
import { CSVComparison } from '@/components/CSVComparison';
import { MonthlyHistory } from '@/components/MonthlyHistory';
import { NewDayDialog } from '@/components/NewDayDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useMonthlyData } from '@/hooks/useMonthlyData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { parse, format, addDays, parseISO } from 'date-fns';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const {
    monthlyLogs,
    currentMonth,
    setCurrentMonth,
    currentLog,
    setFuelData,
    addEntry,
    updateEntry,
    deleteEntry,
    deleteDay,
    setStartMileage,
    addMisdemeanor,
    updateMisdemeanor,
    deleteMisdemeanor,
    waterFillSites,
    addWaterFillSite,
    deleteWaterFillSite,
    isLoading,
    user,
  } = useMonthlyData();

  const [showNewDayDialog, setShowNewDayDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [showSettingsOnStartup, setShowSettingsOnStartup] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('jobs');

  useEffect(() => {
    const stored = localStorage.getItem('watertracker-hide-settings');
    if (stored === 'true') {
      setShowSettingsOnStartup(false);
    } else {
      setShowSettingsDialog(true);
    }
  }, []);

  const handleShowOnStartupChange = (value: boolean) => {
    setShowSettingsOnStartup(value);
    localStorage.setItem('watertracker-hide-settings', value ? 'false' : 'true');
  };

  const selectedDate = parse(currentMonth, 'yyyy-MM', new Date());
  const handleMonthChange = (date: Date) => {
    setCurrentMonth(format(date, 'yyyy-MM'));
    setSelectedDay(date);
  };

  const handleCreateNewDay = (date: Date) => {
    setCurrentMonth(format(date, 'yyyy-MM'));
    setSelectedDay(date);
    toast.success(`Switched to ${format(date, 'MMMM yyyy')} for new day entries`);
  };

  const handleSaveDayAndNext = () => {
    const base = selectedDay || new Date();
    toast.success(`Saved entries for ${format(base, 'EEE, dd MMM yyyy')}`);
    const next = addDays(base, 1);
    handleCreateNewDay(next);
    setActiveTab('jobs');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  // Calculate total distance - only use positive distances
  const totalDistance = currentLog.entries.reduce((acc, e) => {
    let entryDistance = 0;
    if (e.distance && e.distance > 0) {
      entryDistance = e.distance;
    } else if (e.mileageStart !== null && e.mileageEnd !== null) {
      entryDistance = Math.max(0, e.mileageEnd - e.mileageStart);
    }
    return acc + entryDistance;
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onCreateNewDay={() => setShowNewDayDialog(true)}
        onOpenSettings={() => setShowSettingsDialog(true)}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Auth Status Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground" />
            {user ? (
              <span className="text-sm">
                Logged in as <span className="font-medium text-primary">{user.email}</span>
                <span className="text-muted-foreground ml-2">(Cloud sync enabled)</span>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Not logged in - data saved locally only
              </span>
            )}
          </div>
          {user ? (
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
              Sign In to Sync
            </Button>
          )}
        </div>

        <MonthSelector
          selectedMonth={selectedDate}
          onMonthChange={handleMonthChange}
        />

        <Dashboard
          entries={currentLog.entries}
          fuelData={currentLog.fuelData}
          totalDistance={totalDistance}
          startMileage={currentLog.startMileage}
          endMileage={currentLog.endMileage}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 h-auto">
            <TabsTrigger value="jobs" className="text-xs sm:text-sm px-2 py-1 whitespace-normal text-center">
              Jobs
            </TabsTrigger>
            <TabsTrigger value="fuel" className="text-xs sm:text-sm px-2 py-1 whitespace-normal text-center">
              Fuel & Expenses
            </TabsTrigger>
            <TabsTrigger value="misdemeanors" className="text-xs sm:text-sm px-2 py-1 whitespace-normal text-center">
              Misdemeanors
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-xs sm:text-sm px-2 py-1 whitespace-normal text-center">
              Charts
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs sm:text-sm px-2 py-1 whitespace-normal text-center">
              Analysis
            </TabsTrigger>
            <TabsTrigger value="compare" className="text-xs sm:text-sm px-2 py-1 whitespace-normal text-center">
              Compare CSV
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm px-2 py-1 whitespace-normal text-center">
              Monthly Folder
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs sm:text-sm px-2 py-1 whitespace-normal text-center">
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border/60">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Active day
                </span>
                <span className="text-sm font-medium">
                  {selectedDay ? format(selectedDay, 'EEE, dd MMM yyyy') : 'All days in month'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewDayDialog(true)}
                >
                  New Day
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveDayAndNext}
                >
                  Save Day & Next
                </Button>
              </div>
            </div>
            <WaterFillSites
              sites={waterFillSites}
              onAdd={addWaterFillSite}
              onDelete={deleteWaterFillSite}
            />
            <JobEntryTable
              entries={
                selectedDay
                  ? currentLog.entries.filter((e) =>
                      e.date
                        ? format(e.date, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')
                        : true
                    )
                  : currentLog.entries
              }
              startMileage={currentLog.startMileage}
              waterFillSites={waterFillSites}
              onAddEntry={(entry) => addEntry({
                start: entry.start,
                end: entry.end,
                mileageStart: entry.mileageStart || 0,
                mileageEnd: entry.mileageEnd || 0,
                amountPaid: entry.amountPaid,
                orderNumber: entry.orderNumber,
                customer: entry.customer,
                isWaterFill: entry.isWaterFill,
                isParking: entry.isParking,
                date: selectedDay || new Date(),
              })}
              onUpdateEntry={updateEntry}
              onDeleteEntry={deleteEntry}
              onSetStartMileage={setStartMileage}
            />
          </TabsContent>

          <TabsContent value="fuel" className="mt-6">
            <FuelExpenseForm
              fuelData={currentLog.fuelData}
              totalDistance={totalDistance}
              currentMonth={currentMonth}
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

          <TabsContent value="analysis" className="mt-6">
            <MonthlyAnalysis currentLog={currentLog} />
          </TabsContent>

          <TabsContent value="compare" className="mt-6">
            <CSVComparison entries={currentLog.entries} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <MonthlyHistory
              logs={monthlyLogs}
              onSelectDay={(monthKey, dateStr) => {
                setCurrentMonth(monthKey);
                const d = parseISO(dateStr);
                setSelectedDay(d);
                setActiveTab('jobs');
              }}
              onDeleteDay={deleteDay}
            />
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <ExportPanel
              currentLog={currentLog}
              currentMonth={currentMonth}
              waterFillSites={waterFillSites}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* New Day Sheet Dialog */}
      <NewDayDialog
        open={showNewDayDialog}
        onOpenChange={setShowNewDayDialog}
        onCreate={handleCreateNewDay}
        initialDate={selectedDate}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        showOnStartup={showSettingsOnStartup}
        onShowOnStartupChange={handleShowOnStartupChange}
      />
    </div>
  );
};

export default Index;
