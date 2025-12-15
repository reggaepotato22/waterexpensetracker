import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Upload, AlertTriangle } from 'lucide-react';
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
  const [csvPayouts, setCsvPayouts] = useState<CSVPayout[]>([]);
  const [missingPayouts, setMissingPayouts] = useState<number[]>([]);

  const handleAddEntry = () => {
    if (!newEntry.start || !newEntry.end || !newEntry.mileageStart || !newEntry.mileageEnd) {
      toast.error('Please fill in start, end, and mileage fields');
      return;
    }

    const mileageStart = Number(newEntry.mileageStart);
    const mileageEnd = Number(newEntry.mileageEnd);
    const distance = mileageEnd - mileageStart;

    onAddEntry({
      start: newEntry.start,
      end: newEntry.end,
      mileageStart,
      mileageEnd,
      distance,
      totalDistance: null,
      amountPaid: newEntry.amountPaid ? Number(newEntry.amountPaid) : null,
    });

    setNewEntry({ start: '', end: '', mileageStart: '', mileageEnd: '', amountPaid: '' });
    
    // Auto-set next entry's start mileage
    setNewEntry(prev => ({ ...prev, mileageStart: newEntry.mileageEnd }));
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
      const lines = text.split('\n').slice(1); // Skip header
      const payouts: CSVPayout[] = [];
      
      lines.forEach((line, index) => {
        const cols = line.split(',');
        const amount = parseFloat(cols[6]?.trim() || cols[5]?.trim() || ''); // Amount Paid column
        if (!isNaN(amount) && amount > 0) {
          payouts.push({ jobNumber: index + 1, amount });
        }
      });

      setCsvPayouts(payouts);
      
      // Find missing payouts - jobs in CSV that don't have matching amounts in entries
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

  const totalDistance = entries.reduce((sum, e) => sum + (e.distance || 0), 0);
  const totalAmount = entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
  const lastMileage = entries[entries.length - 1]?.mileageEnd || startMileage || 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Job Entries</CardTitle>
        <div className="flex items-center gap-2">
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
              Missing payouts from CSV: {missingPayouts.map(p => `$${p}`).join(', ')}
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
                <TableHead className="w-24">Amount Paid</TableHead>
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
                        className="h-8 text-sm w-20"
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
                  <Input
                    placeholder="Start location"
                    value={newEntry.start}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, start: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="End location"
                    value={newEntry.end}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, end: e.target.value }))}
                    className="h-8 text-sm"
                  />
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
                    className="h-8 text-sm w-20"
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
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-6">
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
            <span className="ml-2 font-bold text-xl text-primary">${totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
