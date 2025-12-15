import { useState, useCallback, useMemo, useEffect } from 'react';
import { MileageEntry, FuelData, MonthlyLog, Misdemeanor } from '@/types/mileage';
import { format } from 'date-fns';

const generateId = () => Math.random().toString(36).substr(2, 9);
const STORAGE_KEY = 'mileage-monthly-logs';

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

const createEmptyLog = (monthKey: string): MonthlyLog => ({
  id: generateId(),
  month: monthKey,
  startMileage: null,
  endMileage: null,
  totalJobs: 0,
  totalDistance: 0,
  entries: [],
  fuelData: { ...emptyFuelData },
  misdemeanors: [],
});

interface ParsedMessage {
  timestamp: Date;
  location: string;
  mileage: number | null;
  rawText: string;
}

export const useMonthlyData = () => {
  const [monthlyLogs, setMonthlyLogs] = useState<Record<string, MonthlyLog>>({});
  const [currentMonth, setCurrentMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setMonthlyLogs(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored data:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(monthlyLogs));
    }
  }, [monthlyLogs, isLoading]);

  const currentLog = useMemo((): MonthlyLog => {
    return monthlyLogs[currentMonth] || createEmptyLog(currentMonth);
  }, [monthlyLogs, currentMonth]);

  const updateCurrentLog = useCallback((updates: Partial<MonthlyLog>) => {
    setMonthlyLogs(prev => ({
      ...prev,
      [currentMonth]: {
        ...(prev[currentMonth] || createEmptyLog(currentMonth)),
        ...updates,
      },
    }));
  }, [currentMonth]);

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

  const setMileage = useCallback((start: number | null, end: number | null) => {
    const distance = start && end ? end - start : 0;
    updateCurrentLog({ 
      startMileage: start, 
      endMileage: end,
      totalDistance: distance > 0 ? distance : currentLog.totalDistance,
    });
  }, [updateCurrentLog, currentLog.totalDistance]);

  const setTotalJobs = useCallback((jobs: number) => {
    updateCurrentLog({ totalJobs: jobs });
  }, [updateCurrentLog]);

  const addMisdemeanor = useCallback((misdemeanor: Omit<Misdemeanor, 'id'>) => {
    const newMisdemeanors = [...(currentLog.misdemeanors || []), { ...misdemeanor, id: generateId() }];
    updateCurrentLog({ misdemeanors: newMisdemeanors });
  }, [currentLog.misdemeanors, updateCurrentLog]);

  const updateMisdemeanor = useCallback((id: string, updates: Partial<Misdemeanor>) => {
    const newMisdemeanors = (currentLog.misdemeanors || []).map(m => 
      m.id === id ? { ...m, ...updates } : m
    );
    updateCurrentLog({ misdemeanors: newMisdemeanors });
  }, [currentLog.misdemeanors, updateCurrentLog]);

  const deleteMisdemeanor = useCallback((id: string) => {
    const newMisdemeanors = (currentLog.misdemeanors || []).filter(m => m.id !== id);
    updateCurrentLog({ misdemeanors: newMisdemeanors });
  }, [currentLog.misdemeanors, updateCurrentLog]);

  const getAllMonths = useCallback(() => {
    return Object.keys(monthlyLogs).sort().reverse();
  }, [monthlyLogs]);

  return {
    currentMonth,
    setCurrentMonth,
    currentLog,
    isLoading,
    entries: currentLog.entries,
    startMileage: currentLog.startMileage,
    totalJobs: currentLog.totalJobs,
    totalDistance: currentLog.totalDistance,
    fuelData: currentLog.fuelData,
    misdemeanors: currentLog.misdemeanors || [],
    setStartMileage,
    setMileage,
    setTotalJobs,
    addEntry,
    addFromMessages,
    updateEntry,
    deleteEntry,
    clearEntries,
    setFuelData,
    addMisdemeanor,
    updateMisdemeanor,
    deleteMisdemeanor,
    getAllMonths,
    getLastMileage,
  };
};
