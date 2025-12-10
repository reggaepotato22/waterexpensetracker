import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
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
}

const QuickEntryForm = ({ onAddEntry, lastMileage }: QuickEntryFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    start: '',
    end: '',
    mileageStart: lastMileage?.toString() || '',
    mileageEnd: '',
  });

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
      mileageStart: formData.mileageEnd, // Set next start to current end
      mileageEnd: '',
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="w-full border-dashed border-2"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Entry Manually
      </Button>
    );
  }

  return (
    <div className="glass-card p-4 animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-foreground">Quick Entry</h3>
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
            Add Entry
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuickEntryForm;
