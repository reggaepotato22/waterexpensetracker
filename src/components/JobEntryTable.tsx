import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Upload, AlertTriangle, Droplet, ParkingCircle, Check, X, FileCheck } from 'lucide-react';
import { MileageEntry, CSVDelivery, WaterFillSite } from '@/types/mileage';
import { toast } from 'sonner';

interface JobEntryTableProps {
  entries: MileageEntry[];
  startMileage: number | null;
  waterFillSites: WaterFillSite[];
  csvDeliveries?: CSVDelivery[];
  onAddEntry: (entry: Omit<MileageEntry, 'id' | 'jobNumber' | 'timestamp' | 'status'>) => void;
  onUpdateEntry: (id: string, updates: Partial<MileageEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onSetStartMileage: (value: number) => void;
}

interface CSVComparison {
  orderNumber: string;
  customer: string;
  earning: number;
  status: 'matched' | 'missing' | 'extra';
  matchedEntryId?: string;
  amountMatches?: boolean;
}

const PLACES_STORAGE_KEY = 'mileage-known-places';

export const JobEntryTable = ({
  entries,
  startMileage,
  waterFillSites,
  csvDeliveries = [],
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onSetStartMileage,
}: JobEntryTableProps) => {
  const [newEntry, setNewEntry] = useState({
    start: '',
    end: '',
    mileageStart: '',
    mileageEnd: '',
    amountPaid: '',
    orderNumber: '',
    customer: '',
    isWaterFill: false,
    isParking: false,
  });
  const [monthStartMileage, setMonthStartMileage] = useState(startMileage?.toString() || '');
  const [csvComparisons, setCsvComparisons] = useState<CSVComparison[]>([]);
  const [csvDeliveriesForAutofill, setCsvDeliveriesForAutofill] = useState<CSVDelivery[]>(csvDeliveries);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [selectedStartIndex, setSelectedStartIndex] = useState(-1);
  const [selectedEndIndex, setSelectedEndIndex] = useState(-1);

  const orderInputRef = useRef<HTMLInputElement | null>(null);
  const startInputRef = useRef<HTMLInputElement | null>(null);
  const endInputRef = useRef<HTMLInputElement | null>(null);
  const mileageStartRef = useRef<HTMLInputElement | null>(null);
  const mileageEndRef = useRef<HTMLInputElement | null>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);

  const [knownPlaces, setKnownPlaces] = useState<string[]>(() => {
    const stored = localStorage.getItem(PLACES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const isWaterFillSite = (location: string) => {
    return waterFillSites.some(site =>
      location.toLowerCase().includes(site.name.toLowerCase())
    );
  };

  useEffect(() => {
    const lastEntry = entries[entries.length - 1];
    if (!entries.length) {
      // New day or cleared list: reset the new-entry row
      setNewEntry({
        start: '',
        end: '',
        mileageStart: '',
        mileageEnd: '',
        amountPaid: '',
        orderNumber: '',
        customer: '',
        isWaterFill: false,
        isParking: false,
      });
      return;
    }

    if (lastEntry && !newEntry.start) {
      setNewEntry(prev => ({
        ...prev,
        start: lastEntry.end,
        mileageStart: lastEntry.mileageEnd?.toString() || '',
      }));
    }
  }, [entries]);

  // Sync CSV deliveries from prop
  useEffect(() => {
    if (csvDeliveries.length > 0) {
      setCsvDeliveriesForAutofill(csvDeliveries);
    }
  }, [csvDeliveries]);

  // Keep CSV comparison results in sync whenever entries or CSV deliveries change.
  useEffect(() => {
    if (!csvDeliveriesForAutofill.length) {
      setCsvComparisons([]);
      return;
    }

    const comparisons: CSVComparison[] = [];

    csvDeliveriesForAutofill.forEach(csv => {
      const matchedEntry = entries.find(e => e.orderNumber === csv.orderNumber);
      if (matchedEntry) {
        comparisons.push({
          orderNumber: csv.orderNumber,
          customer: csv.customer,
          earning: csv.earning,
          status: 'matched',
          matchedEntryId: matchedEntry.id,
          amountMatches: matchedEntry.amountPaid === csv.earning,
        });
      } else {
        comparisons.push({
          orderNumber: csv.orderNumber,
          customer: csv.customer,
          earning: csv.earning,
          status: 'missing',
        });
      }
    });

    entries.forEach(entry => {
      if (entry.orderNumber && !csvDeliveriesForAutofill.find(c => c.orderNumber === entry.orderNumber)) {
        comparisons.push({
          orderNumber: entry.orderNumber,
          customer: entry.customer || '',
          earning: entry.amountPaid || 0,
          status: 'extra',
          matchedEntryId: entry.id,
        });
      }
    });

    setCsvComparisons(comparisons);
  }, [entries, csvDeliveriesForAutofill]);

  useEffect(() => {
    const placesFromEntries = entries.flatMap(e => [e.start, e.end]).filter(Boolean);
    const uniquePlaces = [...new Set([...knownPlaces, ...placesFromEntries])];
    if (uniquePlaces.length !== knownPlaces.length) {
      setKnownPlaces(uniquePlaces);
      localStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(uniquePlaces));
    }
  }, [entries]);

  const filteredStartPlaces = useMemo(() =>
    knownPlaces.filter(p => p.toLowerCase().includes(newEntry.start.toLowerCase())),
    [knownPlaces, newEntry.start]
  );

  const filteredEndPlaces = useMemo(() =>
    knownPlaces.filter(p => p.toLowerCase().includes(newEntry.end.toLowerCase())),
    [knownPlaces, newEntry.end]
  );

  const handleAddEntry = () => {
    if (!newEntry.start || !newEntry.end || !newEntry.mileageStart || !newEntry.mileageEnd) {
      toast.error('Please fill in start, end, and mileage fields');
      return;
    }

    const mileageStart = Number(newEntry.mileageStart);
    const mileageEnd = Number(newEntry.mileageEnd);
    const distance = mileageEnd - mileageStart;

    const newPlaces = [newEntry.start, newEntry.end].filter(p => !knownPlaces.includes(p));
    if (newPlaces.length > 0) {
      const updated = [...knownPlaces, ...newPlaces];
      setKnownPlaces(updated);
      localStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(updated));
    }

    const detectedWaterFill = isWaterFillSite(newEntry.start) || isWaterFillSite(newEntry.end);

    onAddEntry({
      start: newEntry.start,
      end: newEntry.end,
      mileageStart,
      mileageEnd,
      distance,
      totalDistance: null,
      amountPaid: newEntry.amountPaid ? Number(newEntry.amountPaid) : null,
      orderNumber: newEntry.orderNumber || undefined,
      customer: newEntry.customer || undefined,
      isWaterFill: newEntry.isWaterFill || detectedWaterFill,
      isParking: newEntry.isParking,
    });

    setNewEntry({
      start: newEntry.end,
      end: '',
      mileageStart: newEntry.mileageEnd,
      mileageEnd: '',
      amountPaid: '',
      orderNumber: '',
      customer: '',
      isWaterFill: false,
      isParking: false,
    });
  };

  const focusNextField = (field: 'order' | 'start' | 'end' | 'mStart' | 'mEnd' | 'amount') => {
    const map: Record<'order' | 'start' | 'end' | 'mStart' | 'mEnd' | 'amount', React.RefObject<HTMLInputElement>> = {
      order: startInputRef,
      start: endInputRef,
      end: mileageStartRef,
      mStart: mileageEndRef,
      mEnd: amountRef,
      amount: orderInputRef,
    };
    const ref = map[field];
    if (ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  };

  const handleKeyDown =
    (field: 'order' | 'start' | 'end' | 'mStart' | 'mEnd' | 'amount') =>
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      if (field === 'amount') {
        handleAddEntry();
        // Focus the order field of the new blank row
        setTimeout(() => focusNextField('amount'), 0);
      } else {
        focusNextField(field);
      }
    };

  const handleStartMileageSave = () => {
    if (monthStartMileage) {
      onSetStartMileage(Number(monthStartMileage));
      toast.success('Start mileage saved');
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const orderIdx = headers.findIndex(h => h.includes('order'));
      const customerIdx = headers.findIndex(h => h.includes('customer'));
      const earningIdx = headers.findIndex(h => h.includes('earning'));

      if (orderIdx === -1 || earningIdx === -1) {
        toast.error('CSV must have order_number and earning columns');
        return;
      }

      const csvDeliveries: CSVDelivery[] = [];

      lines.slice(1).forEach((line) => {
        if (!line.trim()) return;
        const cols = line.split(',');
        const earning = parseFloat(cols[earningIdx]?.trim() || '0');
        const orderNumber = cols[orderIdx]?.trim() || '';
        const customer = cols[customerIdx]?.trim() || '';

        if (orderNumber) {
          csvDeliveries.push({
            key: orderNumber,
            orderNumber,
            date: '',
            customer,
            volume: 0,
            earning,
          });
        }
      });

      // Store CSV rows in memory for comparison and auto-fill
      setCsvDeliveriesForAutofill(csvDeliveries);
      
      // Also update parent component if needed (for CSVComparison component)
      // This is handled by the parent through the csvDeliveries prop

      // Show a one-time toast based on initial comparison snapshot
      const initialComparisons: CSVComparison[] = [];
      csvDeliveries.forEach(csv => {
        const matchedEntry = entries.find(e => e.orderNumber === csv.orderNumber);
        if (matchedEntry) {
          initialComparisons.push({
            orderNumber: csv.orderNumber,
            customer: csv.customer,
            earning: csv.earning,
            status: 'matched',
            matchedEntryId: matchedEntry.id,
            amountMatches: matchedEntry.amountPaid === csv.earning,
          });
        } else {
          initialComparisons.push({
            orderNumber: csv.orderNumber,
            customer: csv.customer,
            earning: csv.earning,
            status: 'missing',
          });
        }
      });

      const matched = initialComparisons.filter(c => c.status === 'matched').length;
      const missing = initialComparisons.filter(c => c.status === 'missing').length;
      toast.info(`Found ${matched} matched, ${missing} missing from your entries`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApproveAmount = (comparison: CSVComparison) => {
    if (comparison.matchedEntryId) {
      onUpdateEntry(comparison.matchedEntryId, { amountPaid: comparison.earning });
      setCsvComparisons(prev =>
        prev.map(c =>
          c.orderNumber === comparison.orderNumber
            ? { ...c, amountMatches: true }
            : c
        )
      );
      toast.success(`Updated amount for order ${comparison.orderNumber}`);
    }
  };

  const handleAutoFillOrderNumbers = () => {
    if (!csvDeliveriesForAutofill.length) {
      toast.error('No CSV data loaded. Please upload a CSV file first.');
      return;
    }

    let filledCount = 0;
    let updatedCount = 0;

    entries.forEach(entry => {
      // Skip if already has order number
      if (entry.orderNumber) return;

      // Try to match by amount paid
      if (entry.amountPaid && entry.amountPaid > 0) {
        const match = csvDeliveriesForAutofill.find(csv => 
          Math.abs(csv.earning - entry.amountPaid!) < 0.01
        );
        
        if (match) {
          onUpdateEntry(entry.id, { 
            orderNumber: match.orderNumber,
            customer: match.customer || entry.customer
          });
          filledCount++;
          updatedCount++;
          return;
        }
      }

      // Try to match by customer name in start/end locations
      const locations = `${entry.start} ${entry.end}`.toLowerCase();
      const match = csvDeliveriesForAutofill.find(csv => {
        if (!csv.customer) return false;
        const customerLower = csv.customer.toLowerCase();
        return locations.includes(customerLower) || customerLower.includes(locations.trim());
      });

      if (match) {
        onUpdateEntry(entry.id, { 
          orderNumber: match.orderNumber,
          customer: match.customer || entry.customer
        });
        filledCount++;
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      toast.success(`Auto-filled ${updatedCount} order number(s) from CSV`);
    } else {
      toast.info('No matching entries found for auto-fill. Try matching by amount or customer name.');
    }
  };

  const selectPlace = (place: string, field: 'start' | 'end') => {
    setNewEntry(prev => ({ ...prev, [field]: place }));
    if (field === 'start') {
      setShowStartSuggestions(false);
      setSelectedStartIndex(-1);
    }
    if (field === 'end') {
      setShowEndSuggestions(false);
      setSelectedEndIndex(-1);
    }
  };

  // Calculate dropdown position for fixed positioning
  const getDropdownStyle = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (!inputRef.current) return {};
    const rect = inputRef.current.getBoundingClientRect();
    return {
      position: 'fixed' as const,
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 99999,
    };
  };

  // Handle keyboard navigation for suggestions
  const handleSuggestionKeyDown = (
    e: React.KeyboardEvent,
    field: 'start' | 'end',
    suggestions: string[]
  ) => {
    if (field === 'start') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedStartIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedStartIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedStartIndex >= 0) {
        e.preventDefault();
        selectPlace(suggestions[selectedStartIndex], 'start');
        focusNextField('start');
      } else if (e.key === 'Escape') {
        setShowStartSuggestions(false);
        setSelectedStartIndex(-1);
      }
    } else if (field === 'end') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedEndIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedEndIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedEndIndex >= 0) {
        e.preventDefault();
        selectPlace(suggestions[selectedEndIndex], 'end');
        focusNextField('end');
      } else if (e.key === 'Escape') {
        setShowEndSuggestions(false);
        setSelectedEndIndex(-1);
      }
    }
  };

  // Auto-detect parking keyword
  const detectParking = (value: string) => {
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('parking') || lowerValue.includes('park')) {
      setNewEntry(prev => ({ ...prev, isParking: true }));
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedStartIndex >= 0 && startInputRef.current) {
      const dropdown = document.querySelector('[data-start-dropdown]') as HTMLElement;
      if (dropdown) {
        const selectedButton = dropdown.children[selectedStartIndex] as HTMLElement;
        if (selectedButton) {
          selectedButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [selectedStartIndex]);

  useEffect(() => {
    if (selectedEndIndex >= 0 && endInputRef.current) {
      const dropdown = document.querySelector('[data-end-dropdown]') as HTMLElement;
      if (dropdown) {
        const selectedButton = dropdown.children[selectedEndIndex] as HTMLElement;
        if (selectedButton) {
          selectedButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [selectedEndIndex]);

  const totalDistance = entries.reduce((sum, e) => sum + (e.distance || 0), 0);
  const totalAmount = entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
  const paidJobsCount = entries.filter(e => (e.amountPaid || 0) > 0).length;
  const lastMileage = entries[entries.length - 1]?.mileageEnd || startMileage || 0;

  const getRowStyle = (entry: MileageEntry) => {
    // Parking takes priority - highlight entire row
    if (entry.isParking) {
      return 'bg-amber-500/15 border-l-4 border-l-amber-400';
    }
    if (entry.amountPaid && entry.amountPaid > 0) {
      return 'bg-success/15 border-l-4 border-l-success';
    }
    if (entry.isWaterFill) {
      return 'bg-cyan-500/15 border-l-4 border-l-cyan-400';
    }
    return '';
  };

  const matchedCount = csvComparisons.filter(c => c.status === 'matched').length;
  const missingCount = csvComparisons.filter(c => c.status === 'missing').length;
  const extraCount = csvComparisons.filter(c => c.status === 'extra').length;

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xl font-semibold">Job Entries</CardTitle>
          <div className="flex items-center gap-2">
            {csvDeliveriesForAutofill.length > 0 && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAutoFillOrderNumbers}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Auto-Fill Orders
              </Button>
            )}
            <label className="cursor-pointer">
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              <Button variant="outline" size="sm" asChild>
                <span className="gap-2">
                  <Upload className="w-4 h-4" />
                  Compare CSV
                </span>
              </Button>
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto overflow-x-visible">
          {/* Start Mileage */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-muted rounded-lg">
            <span className="font-medium text-foreground min-w-fit">Start Mileage:</span>
            <Input
              type="number"
              className="w-full sm:w-40 text-base"
              value={monthStartMileage}
              onChange={(e) => setMonthStartMileage(e.target.value)}
              placeholder="e.g., 72449"
            />
            <Button size="sm" onClick={handleStartMileageSave}>Save</Button>
          </div>

          {/* Entries Table */}
          <div className="overflow-x-auto overflow-y-visible rounded-lg border border-border">
            <Table className="min-w-[900px] text-sm">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-14 text-center font-semibold">#</TableHead>
                  <TableHead className="min-w-[100px] font-semibold">Order #</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">Start</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">End</TableHead>
                  <TableHead className="w-28 font-semibold">Mi. Start</TableHead>
                  <TableHead className="w-28 font-semibold">Mi. End</TableHead>
                  <TableHead className="w-24 text-center font-semibold">Dist.</TableHead>
                  <TableHead className="w-28 text-center font-semibold">Total</TableHead>
                  <TableHead className="w-32 font-semibold">Amount (KES)</TableHead>
                  <TableHead className="w-20 text-center font-semibold">
                    <Droplet className="w-4 h-4 mx-auto text-cyan-400" />
                  </TableHead>
                  <TableHead className="w-20 text-center font-semibold">
                    <ParkingCircle className="w-4 h-4 mx-auto text-amber-400" />
                  </TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => {
                  const runningTotal = entries
                    .slice(0, index + 1)
                    .reduce((sum, e) => sum + (e.distance || 0), 0);

                  return (
                    <TableRow key={entry.id} className={getRowStyle(entry)}>
                      <TableCell className="font-bold text-primary text-center">{entry.jobNumber}</TableCell>
                      <TableCell>
                        <Input
                          value={entry.orderNumber || ''}
                          onChange={(e) => onUpdateEntry(entry.id, { orderNumber: e.target.value })}
                          className="h-10 text-sm sm:text-base"
                          placeholder="Order #"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={entry.start}
                          onChange={(e) => {
                            const value = e.target.value;
                            const updates: Partial<MileageEntry> = { start: value };

                            // Auto-detect parking
                            const lowerValue = value.toLowerCase();
                            if (lowerValue.includes('parking') || lowerValue.includes('park')) {
                              updates.isParking = true;
                            }

                            onUpdateEntry(entry.id, updates);

                            // When user types the customer location in Start,
                            // try to auto-fill order number for paid jobs.
                            if (!csvDeliveriesForAutofill.length) return;
                            if ((entry.amountPaid || 0) <= 0) return;
                            if (entry.orderNumber) return;

                            const normalized = value.toLowerCase();
                            const match = csvDeliveriesForAutofill.find(csv =>
                              csv.customer &&
                              normalized.includes(csv.customer.toLowerCase())
                            );

                            if (match) {
                              onUpdateEntry(entry.id, { orderNumber: match.orderNumber });
                            }
                          }}
                          className="h-11 text-base sm:text-sm sm:text-base min-w-[140px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={entry.end}
                          onChange={(e) => {
                            const value = e.target.value;
                            const updates: Partial<MileageEntry> = { end: value };

                            // Auto-detect parking
                            const lowerValue = value.toLowerCase();
                            if (lowerValue.includes('parking') || lowerValue.includes('park')) {
                              updates.isParking = true;
                            }

                            onUpdateEntry(entry.id, updates);

                            // Also support matching on End location
                            if (!csvDeliveriesForAutofill.length) return;
                            if ((entry.amountPaid || 0) <= 0) return;
                            if (entry.orderNumber) return;

                            const normalized = value.toLowerCase();
                            const match = csvDeliveriesForAutofill.find(csv =>
                              csv.customer &&
                              normalized.includes(csv.customer.toLowerCase())
                            );

                            if (match) {
                              onUpdateEntry(entry.id, { orderNumber: match.orderNumber });
                            }
                          }}
                          className="h-11 text-base sm:text-sm sm:text-base min-w-[140px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.mileageStart || ''}
                          onChange={(e) => onUpdateEntry(entry.id, { mileageStart: Number(e.target.value) })}
                          className="h-10 text-sm sm:text-base w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.mileageEnd || ''}
                          onChange={(e) => onUpdateEntry(entry.id, { mileageEnd: Number(e.target.value) })}
                          className="h-10 text-sm sm:text-base w-24"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-center">{entry.distance}</TableCell>
                      <TableCell className="font-mono text-center text-muted-foreground">{runningTotal}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.amountPaid || ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const amount = raw ? Number(raw) : null;
                            onUpdateEntry(entry.id, { amountPaid: amount });

                            // When a line becomes "paid", also try to auto-fill
                            // order number using both customer name and cost.
                            if (!csvDeliveriesForAutofill.length) return;
                            if (!amount || amount <= 0) return;
                            if (entry.orderNumber) return;

                            const locations = `${entry.start} ${entry.end}`.toLowerCase();
                            const match = csvDeliveriesForAutofill.find(csv => {
                              const name = csv.customer.toLowerCase();
                              if (!name) return false;
                              const locMatch =
                                locations.includes(name) ||
                                name.includes(locations.trim());
                              const amountMatch =
                                Math.round(csv.earning) === Math.round(amount);
                              return locMatch && amountMatch;
                            });

                            if (match) {
                              onUpdateEntry(entry.id, { orderNumber: match.orderNumber });
                            }
                          }}
                          className="h-10 text-sm sm:text-base w-28"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={entry.isWaterFill}
                          onCheckedChange={(checked) => onUpdateEntry(entry.id, { isWaterFill: !!checked })}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={entry.isParking}
                          onCheckedChange={(checked) => onUpdateEntry(entry.id, { isParking: !!checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteEntry(entry.id)}
                          className="h-10 w-10 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* New Entry Row */}
                <TableRow className="bg-muted/30">
                  <TableCell className="text-muted-foreground text-center font-medium">{entries.length + 1}</TableCell>
                  <TableCell>
                    <Input
                      ref={orderInputRef}
                      placeholder="Order #"
                      value={newEntry.orderNumber}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, orderNumber: e.target.value }))}
                      onKeyDown={handleKeyDown('order')}
                      className="h-10 text-sm sm:text-base"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative z-10">
                      <Input
                        ref={startInputRef}
                        placeholder="Start location"
                        value={newEntry.start}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewEntry(prev => ({ ...prev, start: value }));
                          setSelectedStartIndex(-1);
                          detectParking(value);
                        }}
                        onFocus={() => {
                          setShowStartSuggestions(true);
                          setSelectedStartIndex(-1);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowStartSuggestions(false);
                            setSelectedStartIndex(-1);
                            if (!newEntry.start && filteredStartPlaces.length > 0) {
                              setNewEntry(prev => ({ ...prev, start: filteredStartPlaces[0] }));
                            }
                          }, 150);
                        }}
                        onKeyDown={(e) => {
                          if (showStartSuggestions && filteredStartPlaces.length > 0) {
                            handleSuggestionKeyDown(e, 'start', filteredStartPlaces.slice(0, 5));
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                              return;
                            }
                          }
                          handleKeyDown('start')(e);
                        }}
                        className="h-11 text-base sm:text-sm sm:text-base min-w-[140px]"
                      />
                      {showStartSuggestions && filteredStartPlaces.length > 0 && newEntry.start && (
                        <div 
                          data-start-dropdown
                          className="fixed bg-popover border border-border rounded-md shadow-2xl max-h-60 overflow-y-auto"
                          style={getDropdownStyle(startInputRef)}
                        >
                          {filteredStartPlaces.slice(0, 5).map((place, index) => (
                            <button
                              key={place}
                              onClick={() => selectPlace(place, 'start')}
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseEnter={() => setSelectedStartIndex(index)}
                              className={`w-full px-3 py-2 text-left text-sm ${
                                selectedStartIndex === index 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {place}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="relative z-10">
                      <Input
                        ref={endInputRef}
                        placeholder="End location"
                        value={newEntry.end}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewEntry(prev => ({ ...prev, end: value }));
                          setSelectedEndIndex(-1);
                          detectParking(value);
                        }}
                        onFocus={() => {
                          setShowEndSuggestions(true);
                          setSelectedEndIndex(-1);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowEndSuggestions(false);
                            setSelectedEndIndex(-1);
                            if (!newEntry.end && filteredEndPlaces.length > 0) {
                              setNewEntry(prev => ({ ...prev, end: filteredEndPlaces[0] }));
                            }
                          }, 150);
                        }}
                        onKeyDown={(e) => {
                          if (showEndSuggestions && filteredEndPlaces.length > 0) {
                            handleSuggestionKeyDown(e, 'end', filteredEndPlaces.slice(0, 5));
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                              return;
                            }
                          }
                          handleKeyDown('end')(e);
                        }}
                        className="h-11 text-base sm:text-sm sm:text-base min-w-[140px]"
                      />
                      {showEndSuggestions && filteredEndPlaces.length > 0 && newEntry.end && (
                        <div 
                          data-end-dropdown
                          className="fixed bg-popover border border-border rounded-md shadow-2xl max-h-60 overflow-y-auto"
                          style={getDropdownStyle(endInputRef)}
                        >
                          {filteredEndPlaces.slice(0, 5).map((place, index) => (
                            <button
                              key={place}
                              onClick={() => selectPlace(place, 'end')}
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseEnter={() => setSelectedEndIndex(index)}
                              className={`w-full px-3 py-2 text-left text-sm ${
                                selectedEndIndex === index 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {place}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      ref={mileageStartRef}
                      type="number"
                      placeholder={lastMileage.toString()}
                      value={newEntry.mileageStart}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, mileageStart: e.target.value }))}
                      onKeyDown={handleKeyDown('mStart')}
                      className="h-10 text-sm sm:text-base w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      ref={mileageEndRef}
                      type="number"
                      placeholder="End"
                      value={newEntry.mileageEnd}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, mileageEnd: e.target.value }))}
                      onKeyDown={handleKeyDown('mEnd')}
                      className="h-10 text-sm sm:text-base w-24"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-center">
                    {newEntry.mileageStart && newEntry.mileageEnd
                      ? Number(newEntry.mileageEnd) - Number(newEntry.mileageStart)
                      : '-'}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <Input
                      ref={amountRef}
                      type="number"
                      placeholder="Amount"
                      value={newEntry.amountPaid}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, amountPaid: e.target.value }))}
                      onKeyDown={handleKeyDown('amount')}
                      className="h-10 text-sm sm:text-base w-28"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={newEntry.isWaterFill}
                      onCheckedChange={(checked) => setNewEntry(prev => ({ ...prev, isWaterFill: !!checked }))}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={newEntry.isParking}
                      onCheckedChange={(checked) => setNewEntry(prev => ({ ...prev, isParking: !!checked }))}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAddEntry}
                      className="h-10 w-10 text-primary hover:text-primary"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20 flex-wrap gap-4">
            <div className="flex items-center gap-8 flex-wrap">
              <div>
                <span className="text-sm text-muted-foreground">Paid Jobs:</span>
                <span className="ml-2 font-bold text-xl">{paidJobsCount}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Total Distance:</span>
                <span className="ml-2 font-bold text-xl">{totalDistance.toLocaleString()} km</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">End Mileage:</span>
                <span className="ml-2 font-bold text-xl">{lastMileage.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <span className="ml-2 font-bold text-2xl text-primary">KES {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success/30 border-l-4 border-l-success"></div>
              <span className="text-muted-foreground">Paid Job</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-cyan-500/30 border-l-4 border-l-cyan-400"></div>
              <span className="text-muted-foreground">Water Fill</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500/30 border-l-4 border-l-amber-400"></div>
              <span className="text-muted-foreground">Parking</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSV Comparison Dialog */}
      <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              CSV Comparison Results
            </DialogTitle>
            <DialogDescription>
              Compare your entries with the uploaded CSV file
            </DialogDescription>
          </DialogHeader>

          {/* Summary */}
          <div className="flex flex-wrap gap-4 mb-4">
            <Badge variant="default" className="bg-success/20 text-success border-success/30 px-3 py-1">
              <Check className="w-3 h-3 mr-1" />
              {matchedCount} Matched
            </Badge>
            <Badge variant="destructive" className="px-3 py-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {missingCount} Missing
            </Badge>
            {extraCount > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                <Plus className="w-3 h-3 mr-1" />
                {extraCount} Extra in Entries
              </Badge>
            )}
          </div>

          {/* Matched Orders */}
          {csvComparisons.filter(c => c.status === 'matched').length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-sm text-success mb-2 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Matched Orders
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-success/10">
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">CSV Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvComparisons.filter(c => c.status === 'matched').map((comp) => (
                      <TableRow key={comp.orderNumber}>
                        <TableCell className="font-mono font-medium">{comp.orderNumber}</TableCell>
                        <TableCell>{comp.customer}</TableCell>
                        <TableCell className="text-right font-mono">KES {comp.earning.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          {comp.amountMatches ? (
                            <Badge variant="default" className="bg-success text-success-foreground">
                              <Check className="w-3 h-3 mr-1" /> Amount Matches
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-warning text-warning">
                              Amount Differs
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!comp.amountMatches && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveAmount(comp)}
                            >
                              Update to KES {comp.earning.toLocaleString()}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Missing Orders */}
          {csvComparisons.filter(c => c.status === 'missing').length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-sm text-destructive mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Missing from Your Entries (Add these manually)
              </h3>
              <div className="border border-destructive/30 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-destructive/10">
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Earning (KES)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvComparisons.filter(c => c.status === 'missing').map((comp) => (
                      <TableRow key={comp.orderNumber}>
                        <TableCell className="font-mono font-medium">{comp.orderNumber}</TableCell>
                        <TableCell>{comp.customer}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-destructive">
                          KES {comp.earning.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These orders are in the CSV but not in your entries. Add them manually with the order number.
              </p>
            </div>
          )}

          {/* Extra Orders */}
          {csvComparisons.filter(c => c.status === 'extra').length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Extra Entries (Not in CSV)
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount (KES)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvComparisons.filter(c => c.status === 'extra').map((comp) => (
                      <TableRow key={comp.orderNumber}>
                        <TableCell className="font-mono font-medium">{comp.orderNumber}</TableCell>
                        <TableCell>{comp.customer}</TableCell>
                        <TableCell className="text-right font-mono">
                          KES {comp.earning.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These entries have order numbers that aren't in the uploaded CSV.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowComparisonDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
