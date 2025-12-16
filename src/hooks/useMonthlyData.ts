import { useState, useCallback, useMemo, useEffect } from 'react';
import { MileageEntry, FuelData, MonthlyLog, Misdemeanor, WaterFillSite } from '@/types/mileage';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

const generateId = () => Math.random().toString(36).substr(2, 9);
const STORAGE_KEY = 'mileage-monthly-logs';
const WATER_SITES_KEY = 'water-fill-sites';

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
  fuelConsumptionRate: null,
  otherCosts: null,
  netProfit: null,
  totalLitersUsedDiesel: null,
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

export const useMonthlyData = () => {
  const [monthlyLogs, setMonthlyLogs] = useState<Record<string, MonthlyLog>>({});
  const [currentMonth, setCurrentMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [waterFillSites, setWaterFillSites] = useState<WaterFillSite[]>([]);

  // Check auth and load data
  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        // Load from database
        await loadFromDatabase(session.user.id);
      } else {
        // Load from localStorage for non-authenticated users
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            setMonthlyLogs(JSON.parse(stored));
          } catch (e) {
            console.error('Failed to parse stored data:', e);
          }
        }
        const storedSites = localStorage.getItem(WATER_SITES_KEY);
        if (storedSites) {
          try {
            setWaterFillSites(JSON.parse(storedSites));
          } catch (e) {
            console.error('Failed to parse water sites:', e);
          }
        }
      }
      setIsLoading(false);
    };

    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_OUT') {
        setMonthlyLogs({});
        setWaterFillSites([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadFromDatabase = async (userId: string) => {
    try {
      // Load water fill sites
      const { data: sitesData } = await supabase
        .from('water_fill_sites')
        .select('*')
        .eq('user_id', userId);
      
      if (sitesData) {
        setWaterFillSites(sitesData.map(s => ({ id: s.id, name: s.name })));
      }

      // Load monthly logs
      const { data: logsData } = await supabase
        .from('monthly_logs')
        .select('*')
        .eq('user_id', userId);

      if (logsData) {
        const logs: Record<string, MonthlyLog> = {};
        
        for (const log of logsData) {
          // Load entries for this log
          const { data: entriesData } = await supabase
            .from('job_entries')
            .select('*')
            .eq('monthly_log_id', log.id)
            .order('job_number');

          // Load fuel data
          const { data: fuelDataRow } = await supabase
            .from('fuel_data')
            .select('*')
            .eq('monthly_log_id', log.id)
            .maybeSingle();

          // Load misdemeanors
          const { data: misData } = await supabase
            .from('misdemeanors')
            .select('*')
            .eq('monthly_log_id', log.id);

          const entries: MileageEntry[] = (entriesData || []).map(e => ({
            id: e.id,
            jobNumber: e.job_number,
            orderNumber: e.order_number || undefined,
            customer: e.customer || undefined,
            start: e.start_location,
            end: e.end_location,
            mileageStart: e.mileage_start,
            mileageEnd: e.mileage_end,
            distance: e.distance,
            totalDistance: null,
            amountPaid: e.amount_paid,
            isWaterFill: e.is_water_fill || false,
            isParking: e.is_parking || false,
            date: e.date ? new Date(e.date) : undefined,
            timestamp: new Date(e.created_at),
            status: 'manual' as const,
          }));

          const fuelData: FuelData = fuelDataRow ? {
            fuelCf: fuelDataRow.fuel_cf,
            dieselAmount: fuelDataRow.diesel_amount,
            dieselCost: fuelDataRow.diesel_cost,
            petrolAmount: fuelDataRow.petrol_amount,
            petrolCost: fuelDataRow.petrol_cost,
            totalLitersUsed: fuelDataRow.total_liters_used,
            totalCost: fuelDataRow.total_cost,
            totalExpense: fuelDataRow.total_expense,
            fuelBalance: fuelDataRow.fuel_balance,
            amountEarned: fuelDataRow.amount_earned,
            fuelConsumptionRate: fuelDataRow.fuel_consumption_rate ?? null,
            otherCosts: fuelDataRow.other_costs ?? null,
            netProfit: fuelDataRow.net_profit ?? null,
            totalLitersUsedDiesel: fuelDataRow.total_liters_used_diesel ?? null,
          } : { ...emptyFuelData };

          const misdemeanors: Misdemeanor[] = (misData || []).map(m => ({
            id: m.id,
            date: new Date(m.date),
            type: m.type,
            description: m.description || '',
            fine: m.fine,
            resolved: m.resolved || false,
          }));

          logs[log.month] = {
            id: log.id,
            month: log.month,
            startMileage: log.start_mileage,
            endMileage: log.end_mileage,
            totalJobs: log.total_jobs || 0,
            totalDistance: log.total_distance || 0,
            entries,
            fuelData,
            misdemeanors,
          };
        }
        
        setMonthlyLogs(logs);
      }
    } catch (error) {
      console.error('Error loading from database:', error);
      toast.error('Failed to load data from cloud');
    }
  };

  // Save to localStorage when not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(monthlyLogs));
      localStorage.setItem(WATER_SITES_KEY, JSON.stringify(waterFillSites));
    }
  }, [monthlyLogs, waterFillSites, isLoading, user]);

  const currentLog = useMemo((): MonthlyLog => {
    return monthlyLogs[currentMonth] || createEmptyLog(currentMonth);
  }, [monthlyLogs, currentMonth]);

  const getOrCreateMonthlyLog = async (): Promise<string> => {
    if (!user) return currentLog.id;

    const existing = monthlyLogs[currentMonth];
    if (existing?.id && existing.id.length > 10) return existing.id;

    // Create in database
    const { data, error } = await supabase
      .from('monthly_logs')
      .insert({
        user_id: user.id,
        month: currentMonth,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating monthly log:', error);
      throw error;
    }

    return data.id;
  };

  const updateCurrentLog = useCallback((updates: Partial<MonthlyLog>) => {
    setMonthlyLogs(prev => ({
      ...prev,
      [currentMonth]: {
        ...(prev[currentMonth] || createEmptyLog(currentMonth)),
        ...updates,
      },
    }));
  }, [currentMonth]);

  const setStartMileage = useCallback(async (value: number) => {
    updateCurrentLog({ startMileage: value });
    
    if (user) {
      const logId = await getOrCreateMonthlyLog();
      await supabase
        .from('monthly_logs')
        .update({ start_mileage: value })
        .eq('id', logId);
    }
  }, [updateCurrentLog, user, currentMonth]);

  const addEntry = useCallback(async (data: {
    start: string;
    end: string;
    mileageStart: number;
    mileageEnd: number;
    amountPaid?: number | null;
    orderNumber?: string;
    customer?: string;
    isWaterFill?: boolean;
    isParking?: boolean;
    status?: MileageEntry['status'];
  }) => {
    const distance = data.mileageEnd - data.mileageStart;
    const newEntry: MileageEntry = {
      id: generateId(),
      jobNumber: currentLog.entries.length + 1,
      orderNumber: data.orderNumber,
      customer: data.customer,
      start: data.start,
      end: data.end,
      mileageStart: data.mileageStart,
      mileageEnd: data.mileageEnd,
      distance: distance,
      totalDistance: null,
      amountPaid: data.amountPaid ?? null,
      isWaterFill: data.isWaterFill || false,
      isParking: data.isParking || false,
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

    if (user) {
      try {
        const logId = await getOrCreateMonthlyLog();
        const { data: insertedEntry, error } = await supabase
          .from('job_entries')
          .insert({
            monthly_log_id: logId,
            user_id: user.id,
            job_number: newEntry.jobNumber,
            order_number: data.orderNumber,
            customer: data.customer,
            start_location: data.start,
            end_location: data.end,
            mileage_start: data.mileageStart,
            mileage_end: data.mileageEnd,
            distance: distance,
            amount_paid: data.amountPaid,
            is_water_fill: data.isWaterFill || false,
            is_parking: data.isParking || false,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state with database ID
        if (insertedEntry) {
          setMonthlyLogs(prev => {
            const log = prev[currentMonth] || createEmptyLog(currentMonth);
            return {
              ...prev,
              [currentMonth]: {
                ...log,
                id: logId,
                entries: log.entries.map(e => 
                  e.id === newEntry.id ? { ...e, id: insertedEntry.id } : e
                ),
              },
            };
          });
        }

        await supabase
          .from('monthly_logs')
          .update({ 
            end_mileage: data.mileageEnd,
            total_jobs: newEntries.length,
            total_distance: totalDistance,
          })
          .eq('id', logId);
      } catch (error) {
        console.error('Error saving entry:', error);
      }
    }
  }, [currentLog, updateCurrentLog, user, currentMonth]);

  const updateEntry = useCallback(async (id: string, updates: Partial<MileageEntry>) => {
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

    if (user) {
      const entry = newEntries.find(e => e.id === id);
      if (entry) {
        await supabase
          .from('job_entries')
          .update({
            start_location: entry.start,
            end_location: entry.end,
            mileage_start: entry.mileageStart,
            mileage_end: entry.mileageEnd,
            distance: entry.distance,
            amount_paid: entry.amountPaid,
            order_number: entry.orderNumber,
            customer: entry.customer,
            is_water_fill: entry.isWaterFill,
            is_parking: entry.isParking,
          })
          .eq('id', id);
      }
    }
  }, [currentLog, updateCurrentLog, user]);

  const deleteEntry = useCallback(async (id: string) => {
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

    if (user) {
      await supabase.from('job_entries').delete().eq('id', id);
    }
  }, [currentLog, updateCurrentLog, user]);

  const clearEntries = useCallback(() => {
    updateCurrentLog({
      entries: [],
      totalJobs: 0,
      totalDistance: 0,
      endMileage: null,
    });
  }, [updateCurrentLog]);

  const setFuelData = useCallback(async (data: FuelData) => {
    updateCurrentLog({ fuelData: data });

    if (user) {
      const logId = await getOrCreateMonthlyLog();
      const { data: existing } = await supabase
        .from('fuel_data')
        .select('id')
        .eq('monthly_log_id', logId)
        .maybeSingle();

      const fuelPayload = {
        monthly_log_id: logId,
        user_id: user.id,
        fuel_cf: data.fuelCf,
        diesel_amount: data.dieselAmount,
        diesel_cost: data.dieselCost,
        petrol_amount: data.petrolAmount,
        petrol_cost: data.petrolCost,
        total_liters_used: data.totalLitersUsed,
        total_cost: data.totalCost,
        total_expense: data.totalExpense,
        fuel_balance: data.fuelBalance,
        amount_earned: data.amountEarned,
        fuel_consumption_rate: data.fuelConsumptionRate,
        other_costs: data.otherCosts,
        net_profit: data.netProfit,
        total_liters_used_diesel: data.totalLitersUsedDiesel,
      };

      if (existing) {
        await supabase.from('fuel_data').update(fuelPayload).eq('id', existing.id);
      } else {
        await supabase.from('fuel_data').insert(fuelPayload);
      }
    }
  }, [updateCurrentLog, user, currentMonth]);

  const addMisdemeanor = useCallback(async (misdemeanor: Omit<Misdemeanor, 'id'>) => {
    const newMisdemeanor = { ...misdemeanor, id: generateId() };
    const newMisdemeanors = [...(currentLog.misdemeanors || []), newMisdemeanor];
    updateCurrentLog({ misdemeanors: newMisdemeanors });

    if (user) {
      const logId = await getOrCreateMonthlyLog();
      const { data } = await supabase
        .from('misdemeanors')
        .insert({
          monthly_log_id: logId,
          user_id: user.id,
          date: format(misdemeanor.date, 'yyyy-MM-dd'),
          type: misdemeanor.type,
          description: misdemeanor.description,
          fine: misdemeanor.fine,
          resolved: misdemeanor.resolved,
        })
        .select()
        .single();

      if (data) {
        setMonthlyLogs(prev => {
          const log = prev[currentMonth] || createEmptyLog(currentMonth);
          return {
            ...prev,
            [currentMonth]: {
              ...log,
              misdemeanors: log.misdemeanors.map(m =>
                m.id === newMisdemeanor.id ? { ...m, id: data.id } : m
              ),
            },
          };
        });
      }
    }
  }, [currentLog.misdemeanors, updateCurrentLog, user, currentMonth]);

  const updateMisdemeanor = useCallback(async (id: string, updates: Partial<Misdemeanor>) => {
    const newMisdemeanors = (currentLog.misdemeanors || []).map(m =>
      m.id === id ? { ...m, ...updates } : m
    );
    updateCurrentLog({ misdemeanors: newMisdemeanors });

    if (user) {
      const m = newMisdemeanors.find(mis => mis.id === id);
      if (m) {
        await supabase
          .from('misdemeanors')
          .update({
            date: format(m.date, 'yyyy-MM-dd'),
            type: m.type,
            description: m.description,
            fine: m.fine,
            resolved: m.resolved,
          })
          .eq('id', id);
      }
    }
  }, [currentLog.misdemeanors, updateCurrentLog, user]);

  const deleteMisdemeanor = useCallback(async (id: string) => {
    const newMisdemeanors = (currentLog.misdemeanors || []).filter(m => m.id !== id);
    updateCurrentLog({ misdemeanors: newMisdemeanors });

    if (user) {
      await supabase.from('misdemeanors').delete().eq('id', id);
    }
  }, [currentLog.misdemeanors, updateCurrentLog, user]);

  const addWaterFillSite = useCallback(async (name: string) => {
    const newSite: WaterFillSite = { id: generateId(), name };
    setWaterFillSites(prev => [...prev, newSite]);

    if (user) {
      const { data } = await supabase
        .from('water_fill_sites')
        .insert({ user_id: user.id, name })
        .select()
        .single();

      if (data) {
        setWaterFillSites(prev => prev.map(s => s.id === newSite.id ? { ...s, id: data.id } : s));
      }
    }
  }, [user]);

  const deleteWaterFillSite = useCallback(async (id: string) => {
    setWaterFillSites(prev => prev.filter(s => s.id !== id));

    if (user) {
      await supabase.from('water_fill_sites').delete().eq('id', id);
    }
  }, [user]);

  const getLastMileage = useCallback(() => {
    const last = currentLog.entries[currentLog.entries.length - 1];
    return last?.mileageEnd || currentLog.startMileage;
  }, [currentLog]);

  const getAllMonths = useCallback(() => {
    return Object.keys(monthlyLogs).sort().reverse();
  }, [monthlyLogs]);

  return {
    currentMonth,
    setCurrentMonth,
    currentLog,
    isLoading,
    user,
    entries: currentLog.entries,
    startMileage: currentLog.startMileage,
    totalJobs: currentLog.totalJobs,
    totalDistance: currentLog.totalDistance,
    fuelData: currentLog.fuelData,
    misdemeanors: currentLog.misdemeanors || [],
    waterFillSites,
    setStartMileage,
    addEntry,
    updateEntry,
    deleteEntry,
    clearEntries,
    setFuelData,
    addMisdemeanor,
    updateMisdemeanor,
    deleteMisdemeanor,
    addWaterFillSite,
    deleteWaterFillSite,
    getAllMonths,
    getLastMileage,
  };
};
