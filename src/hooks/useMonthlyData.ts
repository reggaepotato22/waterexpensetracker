import { useState, useCallback, useMemo } from 'react';
import { MileageEntry, FuelData, MonthlyLog } from '@/types/mileage';
import { format } from 'date-fns';

const generateId = () => Math.random().toString(36).substr(2, 9);

const emptyFuelData: FuelData = {
  fuelCf: null,
  dieselAmount: null,
  dieselCost: null,
  petrolAmount: null,
  petrolCost: null,
  totalLitersUsed: null,
  totalCost: null,
  totalExpense: null,
  fuelBalance: null,
  amountEarned: null,
};

interface ParsedMessage {
  timestamp: Date;
  location: string;
  mileage: number | null;
  rawText: string;
}

export const useMonthlyData = () => {
  const [monthlyLogs, setMonthlyLogs] = useState<Record<string, MonthlyLog>>({});
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const currentMonthKey = useMemo(() => format(selectedMonth, 'yyyy-MM'), [selectedMonth]);

  const currentLog = useMemo((): MonthlyLog => {
    return monthlyLogs[currentMonthKey] || {
      id: generateId(),
      month: currentMonthKey,
      startMileage: 72739,
      endMileage: null,
      totalJobs: 0,
      totalDistance: 0,
      entries: [],
      fuelData: { ...emptyFuelData },
    };
  }, [monthlyLogs, currentMonthKey]);

  const updateCurrentLog = useCallback((updates: Partial<MonthlyLog>) => {
    setMonthlyLogs(prev => ({
      ...prev,
      [currentMonthKey]: {
        ...currentLog,
        ...updates,
      },
    }));
  }, [currentMonthKey, currentLog]);

  const setStartMileage = useCallback((value: number) => {
    updateCurrentLog({ startMileage: value });
  }, [updateCurrentLog]);

  const addEntry = useCallback((data: {
    start: string;
    end: string;
    mileageStart: number;
    mileageEnd: number;
    status?: MileageEntry['status'];
  }) => {
    const distance = data.mileageEnd - data.mileageStart;
    const newEntry: MileageEntry = {
      id: generateId(),
      jobNumber: currentLog.entries.length + 1,
      start: data.start,
      end: data.end,
      mileageStart: data.mileageStart,
      mileageEnd: data.mileageEnd,
      distance: distance,
      totalDistance: null,
      amountPaid: null,
      timestamp: new Date(),
      status: data.status || 'manual',
    };

    const newEntries = [...currentLog.entries, newEntry];
    const totalDistance = newEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
    
    updateCurrentLog({
      entries: newEntries,
      totalJobs: newEntries.length,
      totalDistance,
      endMileage: data.mileageEnd,
    });
  }, [currentLog, updateCurrentLog]);

  const addFromMessages = useCallback((messages: ParsedMessage[]) => {
    const newEntries: MileageEntry[] = [];
    let prevMileage = currentLog.startMileage;
    let prevLocation = 'Start';
    let jobNum = currentLog.entries.length;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const currentMileage = msg.mileage;
      
      if (currentMileage && prevMileage) {
        jobNum++;
        const distance = currentMileage - prevMileage;
        
        newEntries.push({
          id: generateId(),
          jobNumber: jobNum,
          start: prevLocation,
          end: msg.location,
          mileageStart: prevMileage,
          mileageEnd: currentMileage,
          distance: distance > 0 ? distance : 0,
          totalDistance: null,
          amountPaid: null,
          timestamp: msg.timestamp,
          status: 'processed',
        });
        
        prevMileage = currentMileage;
        prevLocation = msg.location;
      } else if (msg.location && !currentMileage) {
        prevLocation = msg.location;
      } else if (currentMileage && !prevMileage) {
        prevMileage = currentMileage;
        prevLocation = msg.location || 'Start';
      }
    }

    if (newEntries.length > 0) {
      const allEntries = [...currentLog.entries, ...newEntries];
      const totalDistance = allEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
      const lastEntry = newEntries[newEntries.length - 1];
      
      updateCurrentLog({
        entries: allEntries,
        totalJobs: allEntries.length,
        totalDistance,
        endMileage: lastEntry.mileageEnd,
      });
    }
  }, [currentLog, updateCurrentLog]);

  const updateEntry = useCallback((id: string, updates: Partial<MileageEntry>) => {
    const newEntries = currentLog.entries.map(entry => {
      if (entry.id !== id) return entry;
      const updated = { ...entry, ...updates };
      if (updates.mileageStart !== undefined || updates.mileageEnd !== undefined) {
        updated.distance = (updated.mileageEnd || 0) - (updated.mileageStart || 0);
      }
      return updated;
    });

    const totalDistance = newEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
    const lastEntry = newEntries[newEntries.length - 1];

    updateCurrentLog({
      entries: newEntries,
      totalDistance,
      endMileage: lastEntry?.mileageEnd || null,
    });
  }, [currentLog, updateCurrentLog]);

  const deleteEntry = useCallback((id: string) => {
    const filtered = currentLog.entries.filter(e => e.id !== id);
    const renumbered = filtered.map((e, i) => ({ ...e, jobNumber: i + 1 }));
    const totalDistance = renumbered.reduce((sum, e) => sum + (e.distance || 0), 0);
    const lastEntry = renumbered[renumbered.length - 1];

    updateCurrentLog({
      entries: renumbered,
      totalJobs: renumbered.length,
      totalDistance,
      endMileage: lastEntry?.mileageEnd || null,
    });
  }, [currentLog, updateCurrentLog]);

  const clearEntries = useCallback(() => {
    updateCurrentLog({
      entries: [],
      totalJobs: 0,
      totalDistance: 0,
      endMileage: null,
    });
  }, [updateCurrentLog]);

  const setFuelData = useCallback((data: FuelData) => {
    updateCurrentLog({ fuelData: data });
  }, [updateCurrentLog]);

  const getLastMileage = useCallback(() => {
    const last = currentLog.entries[currentLog.entries.length - 1];
    return last?.mileageEnd || currentLog.startMileage;
  }, [currentLog]);

  return {
    selectedMonth,
    setSelectedMonth,
    currentLog,
    entries: currentLog.entries,
    startMileage: currentLog.startMileage,
    totalJobs: currentLog.totalJobs,
    totalDistance: currentLog.totalDistance,
    fuelData: currentLog.fuelData,
    setStartMileage,
    addEntry,
    addFromMessages,
    updateEntry,
    deleteEntry,
    clearEntries,
    setFuelData,
    getLastMileage,
  };
};
