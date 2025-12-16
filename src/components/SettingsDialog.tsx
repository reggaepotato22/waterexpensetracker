import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showOnStartup?: boolean;
  onShowOnStartupChange?: (value: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange, showOnStartup = true, onShowOnStartupChange }: SettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Default settings</DialogTitle>
          <DialogDescription>
            These are the default assumptions and units used in the water mileage tracker.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-sm">
          <div>
            <h3 className="font-semibold text-foreground">General</h3>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li>Currency: <span className="font-medium text-foreground">KES</span></li>
              <li>Distance unit: <span className="font-medium text-foreground">Kilometers (km)</span></li>
              <li>Fuel unit: <span className="font-medium text-foreground">Liters (L)</span></li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-foreground">Jobs & entries</h3>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li>New jobs automatically continue from the last end location and mileage.</li>
              <li>Known places are remembered on this device to help you with predictions.</li>
              <li>Totals are calculated from your entries in real-time (distance, end mileage, amount).</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-foreground">Fuel & expenses</h3>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li>Fuel consumption rate is in km per liter (km/L).</li>
              <li>Net profit is calculated from amount earned minus fuel and other expenses.</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Future versions will let you customize more options here. For now, these defaults keep
            your entries consistent and easy to compare across days and months.
          </p>

          <Separator />

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="hide-settings-startup"
              checked={!showOnStartup}
              onCheckedChange={(checked) => onShowOnStartupChange?.(!checked)}
            />
            <Label htmlFor="hide-settings-startup" className="text-xs text-muted-foreground">
              Do not show this guide automatically next time
            </Label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


