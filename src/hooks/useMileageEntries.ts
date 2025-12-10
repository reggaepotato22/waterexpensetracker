import { useState, useCallback } from 'react';
import { MileageEntry } from '@/types/mileage';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useMileageEntries = () => {
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [startMileage, setStartMileage] = useState<number | null>(72739); // From screenshot

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
      jobNumber: entries.length + 1,
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
    setEntries(prev => [...prev, newEntry]);
  }, [entries.length]);

  const addFromImage = useCallback((mileage: number, imageUrl: string) => {
    const lastEntry = entries[entries.length - 1];
    const newEntry: MileageEntry = {
      id: generateId(),
      jobNumber: entries.length + 1,
      start: '',
      end: '',
      mileageStart: lastEntry?.mileageEnd || startMileage,
      mileageEnd: mileage,
      distance: lastEntry ? mileage - (lastEntry.mileageEnd || 0) : mileage - (startMileage || 0),
      totalDistance: null,
      amountPaid: null,
      imageUrl,
      timestamp: new Date(),
      status: 'processed',
    };
    setEntries(prev => [...prev, newEntry]);
  }, [entries, startMileage]);

  const updateEntry = useCallback((id: string, updates: Partial<MileageEntry>) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      const updated = { ...entry, ...updates };
      if (updates.mileageStart !== undefined || updates.mileageEnd !== undefined) {
        updated.distance = (updated.mileageEnd || 0) - (updated.mileageStart || 0);
      }
      return updated;
    }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      const filtered = prev.filter(e => e.id !== id);
      // Renumber jobs
      return filtered.map((e, i) => ({ ...e, jobNumber: i + 1 }));
    });
  }, []);

  const getLastMileage = useCallback(() => {
    const last = entries[entries.length - 1];
    return last?.mileageEnd || startMileage;
  }, [entries, startMileage]);

  return {
    entries,
    startMileage,
    setStartMileage,
    addEntry,
    addFromImage,
    updateEntry,
    deleteEntry,
    getLastMileage,
  };
};
