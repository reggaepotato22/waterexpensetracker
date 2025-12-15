import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, AlertTriangle, Droplet, ParkingCircle } from 'lucide-react';
import { MileageEntry, CSVDelivery, WaterFillSite } from '@/types/mileage';
import { toast } from 'sonner';

interface JobEntryTableProps {
  entries: MileageEntry[];
  startMileage: number | null;
  waterFillSites: WaterFillSite[];
  onAddEntry: (entry: Omit<MileageEntry, 'id' | 'jobNumber' | 'timestamp' | 'status'>) => void;
  onUpdateEntry: (id: string, updates: Partial<MileageEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onSetStartMileage: (value: number) => void;
}

interface MissingDelivery {
  orderNumber: string;
  customer: string;
  earning: number;
}

const PLACES_STORAGE_KEY = 'mileage-known-places';

export const JobEntryTable = ({
  entries,
  startMileage,
  waterFillSites,
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
  const [missingDeliveries, setMissingDeliveries] = useState<MissingDelivery[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  const [knownPlaces, setKnownPlaces] = useState<string[]>(() => {
    const stored = localStorage.getItem(PLACES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Check if location is a water fill site
  const isWaterFillSite = (location: string) => {
    return waterFillSites.some(site => 
      location.toLowerCase().includes(site.name.toLowerCase())
    );
  };

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

    // Auto-detect water fill
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

    // Auto-set next entry's start location and mileage
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEntry();
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

      const csvDeliveries: CSVDelivery[] = [];
      
      lines.slice(1).forEach((line) => {
        if (!line.trim()) return;
        const cols = line.split(',');
        const earning = parseFloat(cols[earningIdx]?.trim() || '0');
        const orderNumber = cols[orderIdx]?.trim() || '';
        const customer = cols[customerIdx]?.trim() || '';
        
        if (earning > 0 && orderNumber) {
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

      // Compare with entries - find missing by order number
      const entryOrderNumbers = entries.map(e => e.orderNumber).filter(Boolean);
      const missing = csvDeliveries.filter(d => !entryOrderNumbers.includes(d.orderNumber));
      
      setMissingDeliveries(missing.map(d => ({
        orderNumber: d.orderNumber,
        customer: d.customer,
        earning: d.earning,
      })));
      
      if (missing.length > 0) {
        toast.warning(`Found ${missing.length} deliveries in CSV not in your entries`);
      } else {
        toast.success('All CSV deliveries match your entries!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectPlace = (place: string, field: 'start' | 'end') => {
    setNewEntry(prev => ({ ...prev, [field]: place }));
    if (field === 'start') setShowStartSuggestions(false);
    if (field === 'end') setShowEndSuggestions(false);
  };

  const totalDistance = entries.reduce((sum, e) => sum + (e.distance || 0), 0);
  const totalAmount = entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
  const lastMileage = entries[entries.length - 1]?.mileageEnd || startMileage || 0;

  const getRowStyle = (entry: MileageEntry) => {
    if (entry.amountPaid && entry.amountPaid > 0) {
      return 'bg-success/15 border-l-4 border-l-success';
    }
    if (entry.isWaterFill) {
      return 'bg-cyan-500/15 border-l-4 border-l-cyan-400';
    }
    if (entry.isParking) {
      return 'bg-amber-500/15 border-l-4 border-l-amber-400';
    }
    return '';
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-xl font-semibold">Job Entries</CardTitle>
        <label className="cursor-pointer">
          <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          <Button variant="outline" size="sm" asChild>
            <span className="gap-2">
              <Upload className="w-4 h-4" />
              Compare CSV
            </span>
          </Button>
        </label>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Start Mileage */}
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="font-medium text-foreground min-w-fit">Start Mileage:</span>
          <Input
            type="number"
            className="w-40 text-base"
            value={monthStartMileage}
            onChange={(e) => setMonthStartMileage(e.target.value)}
            placeholder="e.g., 72449"
          />
          <Button size="sm" onClick={handleStartMileageSave}>Save</Button>
        </div>

        {/* Missing Deliveries Alert */}
        {missingDeliveries.length > 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertTriangle className="w-5 h-5" />
              Missing deliveries from CSV:
            </div>
            <div className="flex flex-wrap gap-2">
              {missingDeliveries.map((d, i) => (
                <Badge key={i} variant="destructive" className="text-sm py-1 px-2">
                  #{d.orderNumber} - {d.customer} - KES {d.earning.toLocaleString()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Entries Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
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
                    <TableCell className="font-bold text-primary text-center text-base">{entry.jobNumber}</TableCell>
                    <TableCell>
                      <Input
                        value={entry.orderNumber || ''}
                        onChange={(e) => onUpdateEntry(entry.id, { orderNumber: e.target.value })}
                        className="h-10 text-base"
                        placeholder="Order #"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entry.start}
                        onChange={(e) => onUpdateEntry(entry.id, { start: e.target.value })}
                        className="h-10 text-base min-w-[120px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entry.end}
                        onChange={(e) => onUpdateEntry(entry.id, { end: e.target.value })}
                        className="h-10 text-base min-w-[120px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.mileageStart || ''}
                        onChange={(e) => onUpdateEntry(entry.id, { mileageStart: Number(e.target.value) })}
                        className="h-10 text-base w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.mileageEnd || ''}
                        onChange={(e) => onUpdateEntry(entry.id, { mileageEnd: Number(e.target.value) })}
                        className="h-10 text-base w-24"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-base text-center">{entry.distance}</TableCell>
                    <TableCell className="font-mono text-base text-center text-muted-foreground">{runningTotal}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.amountPaid || ''}
                        onChange={(e) => onUpdateEntry(entry.id, { amountPaid: e.target.value ? Number(e.target.value) : null })}
                        className="h-10 text-base w-28"
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
                    placeholder="Order #"
                    value={newEntry.orderNumber}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, orderNumber: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    className="h-10 text-base"
                  />
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <Input
                      placeholder="Start location"
                      value={newEntry.start}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, start: e.target.value }))}
                      onFocus={() => setShowStartSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
                      onKeyDown={handleKeyDown}
                      className="h-10 text-base min-w-[120px]"
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
                      onKeyDown={handleKeyDown}
                      className="h-10 text-base min-w-[120px]"
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
                    onKeyDown={handleKeyDown}
                    className="h-10 text-base w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="End"
                    value={newEntry.mileageEnd}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, mileageEnd: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    className="h-10 text-base w-24"
                  />
                </TableCell>
                <TableCell className="font-mono text-base text-muted-foreground text-center">
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
                    onKeyDown={handleKeyDown}
                    className="h-10 text-base w-28"
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
              <span className="text-sm text-muted-foreground">No. of Jobs:</span>
              <span className="ml-2 font-bold text-xl">{entries.length}</span>
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
  );
};
