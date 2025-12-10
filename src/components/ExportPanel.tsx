import { Download, FileSpreadsheet, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { MileageEntry, FuelData } from "@/types/mileage";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ExportPanelProps {
  entries: MileageEntry[];
  date: Date;
  startMileage: number | null;
  fuelData: FuelData;
}

const ExportPanel = ({ entries, date, startMileage, fuelData }: ExportPanelProps) => {
  const [copied, setCopied] = useState(false);

  const generateCSV = () => {
    const headers = [
      'Job #', 'Start', 'End', 'Mileage Start', 'Mileage End', 'Distance'
    ];
    const rows = entries.map(e => [
      e.jobNumber,
      e.start,
      e.end,
      e.mileageStart,
      e.mileageEnd,
      e.distance,
    ]);
    
    // Add totals row
    const totalDistance = entries.reduce((sum, e) => sum + (e.distance || 0), 0);
    rows.push(['', '', 'TOTAL', '', '', totalDistance]);
    
    // Add fuel data section
    const fuelSection = [
      [''],
      ['FUEL & EXPENSES'],
      ['Fuel CF', fuelData.fuelCf || ''],
      ['Diesel Amount (L)', fuelData.dieselAmount || ''],
      ['Diesel Cost', fuelData.dieselCost || ''],
      ['Petrol Amount (L)', fuelData.petrolAmount || ''],
      ['Petrol Cost', fuelData.petrolCost || ''],
      ['Total Liters Used', fuelData.totalLitersUsed || ''],
      ['Total Cost', fuelData.totalCost || ''],
      ['Total Expense', fuelData.totalExpense || ''],
      ['Fuel Balance', fuelData.fuelBalance || ''],
      ['Amount Earned', fuelData.amountEarned || ''],
    ];
    
    const csv = [
      headers.join(','), 
      ...rows.map(r => r.join(',')),
      ...fuelSection.map(r => r.join(','))
    ].join('\n');
    return csv;
  };

  const handleDownloadCSV = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mileage-${format(date, 'yyyy-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully');
  };

  const handleCopyToClipboard = async () => {
    const csv = generateCSV();
    await navigator.clipboard.writeText(csv);
    setCopied(true);
    toast.success('Copied to clipboard - paste into Google Sheets');
    setTimeout(() => setCopied(false), 2000);
  };

  const totalDistance = entries.reduce((sum, e) => sum + (e.distance || 0), 0);

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center gap-2 mb-4">
        <FileSpreadsheet className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Export Data</h2>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {format(date, 'MMMM yyyy')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {entries.length} jobs • {totalDistance.toLocaleString()} km
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="default" size="sm" onClick={handleDownloadCSV}>
                <Download className="w-4 h-4" />
                CSV
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Includes mileage entries + fuel/expense data
        </p>
      </div>
    </div>
  );
};

export default ExportPanel;
