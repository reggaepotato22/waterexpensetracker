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
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How this mileage tracker works</DialogTitle>
          <DialogDescription>
            Read this once before you start using the app so your monthly reports stay clean and consistent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2 text-sm">
          <div>
            <h3 className="font-semibold text-foreground">1. Units & currency</h3>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li>Currency: <span className="font-medium text-foreground">KES</span> (Kenyan Shillings).</li>
              <li>Distance: <span className="font-medium text-foreground">Kilometers (km)</span>.</li>
              <li>Fuel volume: <span className="font-medium text-foreground">Liters (L)</span>.</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-foreground">2. Months, days & saving</h3>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li>The selector at the top chooses the <span className="font-medium text-foreground">active month</span> (e.g. March 2025).</li>
              <li>The Jobs tab works on a single <span className="font-medium text-foreground">day inside that month</span>.</li>
              <li>Use <span className="font-medium text-foreground">New Day</span> or click a day in the Monthly Folder tab to switch the active day.</li>
              <li><span className="font-medium text-foreground">Save Day &amp; Next</span> saves the current day and moves you automatically to the next day to continue recording.</li>
              <li>All entries are stored as part of the current month, and the <span className="font-medium text-foreground">Dashboard</span> and <span className="font-medium text-foreground">Monthly Folder</span> always show full-month totals.</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-foreground">3. Job entries</h3>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li>Each line in <span className="font-medium text-foreground">Job Entries</span> is one trip for the active day.</li>
              <li><span className="font-medium text-foreground">Mi. Start / Mi. End</span> must be filled for distance to be calculated.</li>
              <li>The app calculates <span className="font-medium text-foreground">Dist.</span> (trip distance) and running <span className="font-medium text-foreground">Total</span> automatically.</li>
              <li>New rows prefill the last end location and mileage to make data entry faster.</li>
              <li>Use the Water Fill / Parking checkboxes to tag special trips (these affect row colours but not distance maths).</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-foreground">4. Known places & autocomplete</h3>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li>Every Start / End you type is remembered locally as a <span className="font-medium text-foreground">known place</span>.</li>
              <li>When you focus a Start or End field, the app suggests matching places so you don&apos;t have to retype common locations.</li>
              <li>Known places are stored only on this device (they are not synced to the cloud).</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-foreground">5. CSV import & Order # auto-fill</h3>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li>The <span className="font-medium text-foreground">Compare CSV</span> button expects a file with at least <span className="font-medium">order</span>, <span className="font-medium">customer</span> and <span className="font-medium">earning</span> columns.</li>
              <li>After upload, the app shows which orders are <span className="font-medium text-foreground">Matched</span>, <span className="font-medium text-foreground">Missing</span> (in CSV but not in your jobs) and <span className="font-medium text-foreground">Extra</span> (in your jobs but not in CSV).</li>
              <li>For <span className="font-medium text-foreground">paid job lines only</span> (Amount &gt; 0), the app can auto-fill <span className="font-medium text-foreground">Order #</span> when your Start/End location and Amount match a row in the CSV.</li>
              <li>You can also update mismatched amounts from the CSV comparison dialog with one click.</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-foreground">6. Fuel & expenses</h3>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li>Fuel consumption is in <span className="font-medium text-foreground">km per liter (km/L)</span>.</li>
              <li>The app can back-calculate liters used based on your total distance and fuel consumption rate.</li>
              <li><span className="font-medium text-foreground">Net profit</span> is computed from Amount Earned minus fuel costs, other expenses and any extra costs you enter.</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-foreground">7. Cloud sync & devices</h3>
            <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
              <li>If you are signed in, months, job entries, fuel data and water fill sites sync to the cloud.</li>
              <li>If you are not signed in, data is stored locally in this browser only.</li>
              <li>Known places and the &quot;don&apos;t show this again&quot; setting are always local to this device.</li>
            </ul>
          </div>

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


