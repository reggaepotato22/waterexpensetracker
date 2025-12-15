import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Upload, AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';
import { MileageEntry } from '@/types/mileage';
import { toast } from 'sonner';

interface JobEntryTableProps {
  entries: MileageEntry[];
  startMileage: number | null;
  onAddEntry: (entry: Omit<MileageEntry, 'id' | 'jobNumber' | 'timestamp' | 'status'>) => void;
  onUpdateEntry: (id: string, updates: Partial<MileageEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onSetStartMileage: (value: number) => void;
}

interface CSVPayout {
  jobNumber: number;
  amount: number;
}

const PLACES_STORAGE_KEY = 'mileage-known-places';

export const JobEntryTable = ({
  entries,
  startMileage,
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
  });
  const [monthStartMileage, setMonthStartMileage] = useState(startMileage?.toString() || '');
  const [missingPayouts, setMissingPayouts] = useState<number[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  // Load and manage known places
  const [knownPlaces, setKnownPlaces] = useState<string[]>(() => {
    const stored = localStorage.getItem(PLACES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Auto-fill start location from previous end location
  useEffect(() => {
    const lastEntry = entries[entries.length - 1];
    if (lastEntry && !newEntry.start) {
      setNewEntry(prev => ({
        ...prev,
        start: lastEntry.end,
        mileageStart: lastEntry.mileageEnd?.toString() || '',
      }));
    }
  }, [entries]);

  // Update known places when entries change
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

    // Save new places
    const newPlaces = [newEntry.start, newEntry.end].filter(p => !knownPlaces.includes(p));
    if (newPlaces.length > 0) {
      const updated = [...knownPlaces, ...newPlaces];
      setKnownPlaces(updated);
      localStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(updated));
    }

    onAddEntry({
      start: newEntry.start,
      end: newEntry.end,
      mileageStart,
      mileageEnd,
      distance,
      totalDistance: null,
      amountPaid: newEntry.amountPaid ? Number(newEntry.amountPaid) : null,
    });

    // Auto-set next entry's start location and mileage
    setNewEntry({
      start: newEntry.end,
      end: '',
      mileageStart: newEntry.mileageEnd,
      mileageEnd: '',
      amountPaid: '',
    });
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
      const lines = text.split('\n').slice(1);
      const payouts: CSVPayout[] = [];
      
      lines.forEach((line, index) => {
        const cols = line.split(',');
        const amount = parseFloat(cols[6]?.trim() || cols[5]?.trim() || '');
        if (!isNaN(amount) && amount > 0) {
          payouts.push({ jobNumber: index + 1, amount });
        }
      });

      const entryAmounts = entries.map(e => e.amountPaid).filter(a => a !== null);
      const csvAmounts = payouts.map(p => p.amount);
      const missing = csvAmounts.filter(amt => !entryAmounts.includes(amt));
      setMissingPayouts(missing);
      
      if (missing.length > 0) {
        toast.warning(`Found ${missing.length} payouts in CSV not matched in your entries`);
      } else {
        toast.success('All CSV payouts match your entries');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadCSV = () => {
    const headers = ['Job #', 'Start', 'End', 'Mileage Start', 'Mileage End', 'Distance', 'Total Distance', 'Amount Paid (KES)'];
    let runningTotal = 0;
    const rows = entries.map(entry => {
      runningTotal += entry.distance || 0;
      return [
        entry.jobNumber,
        entry.start,
        entry.end,
        entry.mileageStart,
        entry.mileageEnd,
        entry.distance,
        runningTotal,
        entry.amountPaid || 0,
      ].join(',');
    });

    const totalsRow = ['', '', '', '', 'Total:', totalDistance, '', totalAmount].join(',');
    const csvContent = [headers.join(','), ...rows, totalsRow].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-entries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const handleExportGoogleSheets = () => {
    const headers = ['Job #', 'Start', 'End', 'Mileage Start', 'Mileage End', 'Distance', 'Total Distance', 'Amount Paid (KES)'];
    let runningTotal = 0;
    const rows = entries.map(entry => {
      runningTotal += entry.distance || 0;
      return [
        entry.jobNumber,
        entry.start,
        entry.end,
        entry.mileageStart,
        entry.mileageEnd,
        entry.distance,
        runningTotal,
        entry.amountPaid || 0,
      ];
    });

    const data = [headers, ...rows];
    const csvContent = data.map(row => row.join('\t')).join('\n');
    
    navigator.clipboard.writeText(csvContent).then(() => {
      toast.success('Data copied! Paste into Google Sheets (Ctrl+V)');
    }).catch(() => {
      toast.error('Failed to copy. Try downloading CSV instead.');
    });
  };

  const selectPlace = (place: string, field: 'start' | 'end') => {
    setNewEntry(prev => ({ ...prev, [field]: place }));
    if (field === 'start') setShowStartSuggestions(false);
    if (field === 'end') setShowEndSuggestions(false);
  };

  const totalDistance = entries.reduce((sum, e) => sum + (e.distance || 0), 0);
  const totalAmount = entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
  const lastMileage = entries[entries.length - 1]?.mileageEnd || startMileage || 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-lg">Job Entries</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportGoogleSheets}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Copy for Sheets
          </Button>
          <label className="cursor-pointer">
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Compare CSV
              </span>
            </Button>
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Start Mileage */}
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <span className="font-medium text-muted-foreground">Start Mileage:</span>
          <Input
            type="number"
            className="w-32"
            value={monthStartMileage}
            onChange={(e) => setMonthStartMileage(e.target.value)}
            placeholder="e.g., 72449"
          />
          <Button size="sm" onClick={handleStartMileageSave}>Save</Button>
        </div>

        {/* Missing Payouts Alert */}
        {missingPayouts.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">
              Missing payouts from CSV: {missingPayouts.map(p => `KES ${p}`).join(', ')}
            </span>
          </div>
        )}

        {/* Entries Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="w-24">Mileage Start</TableHead>
                <TableHead className="w-24">Mileage End</TableHead>
                <TableHead className="w-20">Distance</TableHead>
                <TableHead className="w-24">Total Dist.</TableHead>
                <TableHead className="w-28">Amount (KES)</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => {
                const runningTotal = entries
                  .slice(0, index + 1)
                  .reduce((sum, e) => sum + (e.distance || 0), 0);
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-primary">{entry.jobNumber}</TableCell>
                    <TableCell>
                      <Input
                        value={entry.start}
                        onChange={(e) => onUpdateEntry(entry.id, { start: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entry.end}
                        onChange={(e) => onUpdateEntry(entry.id, { end: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.mileageStart || ''}
                        onChange={(e) => onUpdateEntry(entry.id, { mileageStart: Number(e.target.value) })}
                        className="h-8 text-sm w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.mileageEnd || ''}
                        onChange={(e) => onUpdateEntry(entry.id, { mileageEnd: Number(e.target.value) })}
                        className="h-8 text-sm w-20"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{entry.distance}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{runningTotal}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.amountPaid || ''}
                        onChange={(e) => onUpdateEntry(entry.id, { amountPaid: e.target.value ? Number(e.target.value) : null })}
                        className="h-8 text-sm w-24"
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* New Entry Row */}
              <TableRow className="bg-muted/50">
                <TableCell className="text-muted-foreground">{entries.length + 1}</TableCell>
                <TableCell>
                  <div className="relative">
                    <Input
                      placeholder="Start location"
                      value={newEntry.start}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, start: e.target.value }))}
                      onFocus={() => setShowStartSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
                      className="h-8 text-sm"
                    />
                    {showStartSuggestions && filteredStartPlaces.length > 0 && newEntry.start && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredStartPlaces.slice(0, 5).map(place => (
                          <button
                            key={place}
                            onClick={() => selectPlace(place, 'start')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            {place}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <Input
                      placeholder="End location"
                      value={newEntry.end}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, end: e.target.value }))}
                      onFocus={() => setShowEndSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowEndSuggestions(false), 200)}
                      className="h-8 text-sm"
                    />
                    {showEndSuggestions && filteredEndPlaces.length > 0 && newEntry.end && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredEndPlaces.slice(0, 5).map(place => (
                          <button
                            key={place}
                            onClick={() => selectPlace(place, 'end')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
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
                    type="number"
                    placeholder={lastMileage.toString()}
                    value={newEntry.mileageStart}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, mileageStart: e.target.value }))}
                    className="h-8 text-sm w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="End"
                    value={newEntry.mileageEnd}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, mileageEnd: e.target.value }))}
                    className="h-8 text-sm w-20"
                  />
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {newEntry.mileageStart && newEntry.mileageEnd 
                    ? Number(newEntry.mileageEnd) - Number(newEntry.mileageStart)
                    : '-'}
                </TableCell>
                <TableCell></TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newEntry.amountPaid}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, amountPaid: e.target.value }))}
                    className="h-8 text-sm w-24"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAddEntry}
                    className="h-8 w-8 text-primary hover:text-primary"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20 flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <span className="text-sm text-muted-foreground">No. of Jobs:</span>
              <span className="ml-2 font-bold text-lg">{entries.length}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Distance:</span>
              <span className="ml-2 font-bold text-lg">{totalDistance} km</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">End Mileage:</span>
              <span className="ml-2 font-bold text-lg">{lastMileage}</span>
            </div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Total Amount:</span>
            <span className="ml-2 font-bold text-xl text-primary">KES {totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
