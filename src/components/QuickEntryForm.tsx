import { useState, useMemo } from "react";
import { Plus, MapPin, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface QuickEntryFormProps {
  onAddEntry: (entry: {
    start: string;
    end: string;
    mileageStart: number;
    mileageEnd: number;
  }) => void;
  lastMileage: number | null;
  startMileage: number | null;
  onStartMileageChange: (value: number) => void;
  totalJobs: number;
  totalDistance: number;
}

const QuickEntryForm = ({ 
  onAddEntry, 
  lastMileage, 
  startMileage, 
  onStartMileageChange,
  totalJobs,
  totalDistance 
}: QuickEntryFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    start: '',
    end: '',
    mileageStart: lastMileage?.toString() || '',
    mileageEnd: '',
  });

  // Calculate distance preview
  const distancePreview = useMemo(() => {
    const start = Number(formData.mileageStart);
    const end = Number(formData.mileageEnd);
    if (start && end && end > start) {
      return end - start;
    }
    return null;
  }, [formData.mileageStart, formData.mileageEnd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEntry({
      start: formData.start,
      end: formData.end,
      mileageStart: Number(formData.mileageStart),
      mileageEnd: Number(formData.mileageEnd),
    });
    setFormData({
      start: '',
      end: '',
      mileageStart: formData.mileageEnd,
      mileageEnd: '',
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-foreground text-sm">Monthly Summary</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-2 rounded-lg bg-secondary/50">
            <p className="text-2xl font-bold text-primary">{totalJobs}</p>
            <p className="text-xs text-muted-foreground">Total Jobs</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary/50">
            <p className="text-2xl font-bold text-foreground">{totalDistance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total km</p>
          </div>
        </div>
      </div>

      {/* Start Mileage Setting */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Month Start Mileage</p>
            <p className="text-xs text-muted-foreground">Initial odometer reading</p>
          </div>
          <Input
            type="number"
            value={startMileage || ''}
            onChange={(e) => onStartMileageChange(Number(e.target.value))}
            className="w-32 h-9 font-mono text-right"
            placeholder="72739"
          />
        </div>
      </div>

      {!isOpen ? (
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(true)}
          className="w-full border-dashed border-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry Manually
        </Button>
      ) : (
        <div className="glass-card p-4 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Quick Entry</h3>
              </div>
              {distancePreview && (
                <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                  +{distancePreview} km
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start" className="text-xs">Start Location</Label>
                <Input
                  id="start"
                  placeholder="e.g., Parking"
                  value={formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end" className="text-xs">End Location</Label>
                <Input
                  id="end"
                  placeholder="e.g., Kilimanjaro"
                  value={formData.end}
                  onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mileageStart" className="text-xs">Mileage Start</Label>
                <Input
                  id="mileageStart"
                  type="number"
                  placeholder="72739"
                  value={formData.mileageStart}
                  onChange={(e) => setFormData({ ...formData, mileageStart: e.target.value })}
                  className="h-9 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileageEnd" className="text-xs">Mileage End</Label>
                <Input
                  id="mileageEnd"
                  type="number"
                  placeholder="72742"
                  value={formData.mileageEnd}
                  onChange={(e) => setFormData({ ...formData, mileageEnd: e.target.value })}
                  className="h-9 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Add Entry (Job #{totalJobs + 1})
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default QuickEntryForm;
