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
import StatsCards from '@/components/StatsCards';
import { MonthlyCharts } from '@/components/MonthlyCharts';
import { useMonthlyData } from '@/hooks/useMonthlyData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { parse, format } from 'date-fns';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
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
    waterFillSites,
    addWaterFillSite,
    deleteWaterFillSite,
    isLoading,
    user,
  } = useMonthlyData();

  const selectedDate = parse(currentMonth, 'yyyy-MM', new Date());
  const handleMonthChange = (date: Date) => {
    setCurrentMonth(format(date, 'yyyy-MM'));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
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

        <StatsCards
          entries={currentLog.entries}
          startMileage={currentLog.startMileage}
          fuelData={currentLog.fuelData}
        />

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12">
            <TabsTrigger value="jobs" className="text-sm">Jobs</TabsTrigger>
            <TabsTrigger value="fuel" className="text-sm">Fuel & Expenses</TabsTrigger>
            <TabsTrigger value="misdemeanors" className="text-sm">Misdemeanors</TabsTrigger>
            <TabsTrigger value="charts" className="text-sm">Charts</TabsTrigger>
            <TabsTrigger value="export" className="text-sm">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-6 space-y-6">
            <WaterFillSites
              sites={waterFillSites}
              onAdd={addWaterFillSite}
              onDelete={deleteWaterFillSite}
            />
            <JobEntryTable
              entries={currentLog.entries}
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

          <TabsContent value="export" className="mt-6">
            <ExportPanel
              currentLog={currentLog}
              currentMonth={currentMonth}
              waterFillSites={waterFillSites}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
