import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface NewDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (date: Date) => void;
  initialDate: Date;
}

export const NewDayDialog = ({
  open,
  onOpenChange,
  onCreate,
  initialDate,
}: NewDayDialogProps) => {
  const [dateValue, setDateValue] = useState<string>(
    format(initialDate, 'yyyy-MM-dd'),
  );

  const handleConfirm = () => {
    const parsed = new Date(dateValue);
    if (isNaN(parsed.getTime())) return;
    onCreate(parsed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new day sheet</DialogTitle>
          <DialogDescription>
            Pick the day you want to enter jobs and fuel details for. You can
            use this when you missed some days and want to fill them in later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label className="text-sm font-medium text-foreground flex flex-col gap-2">
            Day
            <Input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            We&apos;ll switch the sheet to{' '}
            <span className="font-medium">
              {format(new Date(dateValue), 'MMMM yyyy')}
            </span>{' '}
            so you can record entries for that day.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Start new day</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};




