import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Trash2, Check } from 'lucide-react';
import { Misdemeanor } from '@/types/mileage';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MisdemeanorEntryProps {
  misdemeanors: Misdemeanor[];
  onAdd: (misdemeanor: Omit<Misdemeanor, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Misdemeanor>) => void;
  onDelete: (id: string) => void;
}

const MISDEMEANOR_TYPES = [
  'Speeding',
  'Parking Violation',
  'Traffic Light Violation',
  'Late Delivery',
  'Customer Complaint',
  'Vehicle Damage',
  'Documentation Error',
  'Safety Violation',
  'Other',
];

export const MisdemeanorEntry = ({ 
  misdemeanors, 
  onAdd, 
  onUpdate, 
  onDelete 
}: MisdemeanorEntryProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: '',
    description: '',
    fine: '',
  });

  const handleAdd = () => {
    if (!newEntry.type) {
      toast.error('Please select a type');
      return;
    }

    onAdd({
      date: new Date(newEntry.date),
      type: newEntry.type,
      description: newEntry.description,
      fine: newEntry.fine ? parseFloat(newEntry.fine) : null,
      resolved: false,
    });

    setNewEntry({
      date: format(new Date(), 'yyyy-MM-dd'),
      type: '',
      description: '',
      fine: '',
    });
    setIsAdding(false);
    toast.success('Misdemeanor recorded');
  };

  const totalFines = misdemeanors.reduce((sum, m) => sum + (m.fine || 0), 0);
  const unresolvedCount = misdemeanors.filter(m => !m.resolved).length;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Misdemeanors & Violations
          {unresolvedCount > 0 && (
            <Badge variant="destructive">{unresolvedCount} unresolved</Badge>
          )}
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 border border-border rounded-lg bg-muted/50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={newEntry.type} 
                  onValueChange={(value) => setNewEntry({ ...newEntry, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MISDEMEANOR_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Fine Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newEntry.fine}
                  onChange={(e) => setNewEntry({ ...newEntry, fine: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Details..."
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add Misdemeanor</Button>
            </div>
          </div>
        )}

        {misdemeanors.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {misdemeanors.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{format(new Date(m.date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{m.type}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{m.description || '-'}</TableCell>
                    <TableCell>{m.fine ? `$${m.fine.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={m.resolved ? 'secondary' : 'destructive'}>
                        {m.resolved ? 'Resolved' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!m.resolved && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdate(m.id, { resolved: true })}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(m.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end p-2 bg-muted rounded-lg">
              <span className="text-muted-foreground">Total Fines: </span>
              <span className="ml-2 font-bold text-destructive">${totalFines.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No misdemeanors recorded this month
          </div>
        )}
      </CardContent>
    </Card>
  );
};
