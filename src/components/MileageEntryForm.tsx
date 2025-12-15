import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Gauge, Route, Briefcase } from 'lucide-react';

interface MileageEntryFormProps {
  startMileage: number | null;
  endMileage: number | null;
  totalJobs: number;
  onSave: (startMileage: number | null, endMileage: number | null, totalJobs: number) => void;
}

export const MileageEntryForm = ({ 
  startMileage: initialStart, 
  endMileage: initialEnd, 
  totalJobs: initialJobs,
  onSave 
}: MileageEntryFormProps) => {
  const [startMileage, setStartMileage] = useState(initialStart?.toString() || '');
  const [endMileage, setEndMileage] = useState(initialEnd?.toString() || '');
  const [totalJobs, setTotalJobs] = useState(initialJobs?.toString() || '');

  useEffect(() => {
    setStartMileage(initialStart?.toString() || '');
    setEndMileage(initialEnd?.toString() || '');
    setTotalJobs(initialJobs?.toString() || '');
  }, [initialStart, initialEnd, initialJobs]);

  const distance = startMileage && endMileage 
    ? Math.max(0, Number(endMileage) - Number(startMileage)) 
    : 0;

  const handleSave = () => {
    onSave(
      startMileage ? Number(startMileage) : null,
      endMileage ? Number(endMileage) : null,
      totalJobs ? Number(totalJobs) : 0
    );
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Monthly Mileage Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startMileage">Month Start Mileage</Label>
            <Input
              id="startMileage"
              type="number"
              placeholder="e.g., 12500"
              value={startMileage}
              onChange={(e) => setStartMileage(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endMileage">Month End Mileage</Label>
            <Input
              id="endMileage"
              type="number"
              placeholder="e.g., 14200"
              value={endMileage}
              onChange={(e) => setEndMileage(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="totalJobs">Total Jobs</Label>
            <Input
              id="totalJobs"
              type="number"
              placeholder="e.g., 45"
              value={totalJobs}
              onChange={(e) => setTotalJobs(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Total Distance:</span>
              <span className="text-xl font-bold text-foreground">{distance.toLocaleString()} km</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Jobs:</span>
              <span className="text-xl font-bold text-foreground">{totalJobs || 0}</span>
            </div>
          </div>
          <Button onClick={handleSave}>Save Mileage</Button>
        </div>
      </CardContent>
    </Card>
  );
};
