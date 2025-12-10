import { useState, useCallback } from 'react';
import { MileageEntry } from '@/types/mileage';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface ParsedMessage {
  timestamp: Date;
  location: string;
  mileage: number | null;
  rawText: string;
}

export const useMileageEntries = () => {
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [startMileage, setStartMileage] = useState<number | null>(72739);

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

  const addFromMessages = useCallback((messages: ParsedMessage[]) => {
    const newEntries: MileageEntry[] = [];
    let prevMileage = startMileage;
    let prevLocation = 'Start';
    let jobNum = entries.length;

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
        // Just update location for next entry
        prevLocation = msg.location;
      } else if (currentMileage && !prevMileage) {
        // Set initial mileage
        prevMileage = currentMileage;
        prevLocation = msg.location || 'Start';
      }
    }

    if (newEntries.length > 0) {
      setEntries(prev => [...prev, ...newEntries]);
    }
  }, [entries.length, startMileage]);

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
      return filtered.map((e, i) => ({ ...e, jobNumber: i + 1 }));
    });
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
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
    addFromMessages,
    updateEntry,
    deleteEntry,
    clearEntries,
    getLastMileage,
  };
};
