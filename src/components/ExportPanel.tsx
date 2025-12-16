import { Download, FileSpreadsheet, Copy, Check, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { MonthlyLog, WaterFillSite } from "@/types/mileage";
import { useState } from "react";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";

interface ExportPanelProps {
  currentLog: MonthlyLog;
  currentMonth: string;
  waterFillSites: WaterFillSite[];
}

const ExportPanel = ({ currentLog, currentMonth, waterFillSites }: ExportPanelProps) => {
  const [copied, setCopied] = useState(false);
  const [showCopyFallback, setShowCopyFallback] = useState(false);
  const [lastCopyContent, setLastCopyContent] = useState('');
  const monthDate = parse(currentMonth, 'yyyy-MM', new Date());
  const monthName = format(monthDate, 'MMMM yyyy');

  const generateCSV = () => {
    const headers = [
      'Job #', 'Order #', 'Start', 'End', 'Mileage Start', 'Mileage End', 'Distance', 'Amount (KES)', 'Water Fill', 'Parking'
    ];
    let runningTotal = 0;
    const rows = currentLog.entries.map(e => {
      runningTotal += e.distance || 0;
      return [
        e.jobNumber,
        e.orderNumber || '',
        e.start,
        e.end,
        e.mileageStart,
        e.mileageEnd,
        e.distance,
        e.amountPaid || 0,
        e.isWaterFill ? 'Yes' : '',
        e.isParking ? 'Yes' : '',
      ];
    });
    
    const totalDistance = currentLog.entries.reduce((sum, e) => sum + (e.distance || 0), 0);
    const totalAmount = currentLog.entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
    rows.push(['', '', '', 'TOTAL', '', '', totalDistance, totalAmount, '', '']);
    
    const fuelData = currentLog.fuelData;
    const fuelSection = [
      [''],
      ['FUEL & EXPENSES'],
      ['Fuel CF', fuelData.fuelCf || ''],
      ['Diesel Amount (L)', fuelData.dieselAmount || ''],
      ['Diesel Cost (KES)', fuelData.dieselCost || ''],
      ['Petrol Amount (L)', fuelData.petrolAmount || ''],
      ['Petrol Cost (KES)', fuelData.petrolCost || ''],
      ['Fuel Consumption (km/L)', fuelData.fuelConsumptionRate || ''],
      ['Total Liters Used - Diesel', fuelData.totalLitersUsedDiesel || fuelData.totalLitersUsed || ''],
      ['Total Cost (KES)', fuelData.totalCost || ''],
      ['Total Expense (KES)', fuelData.totalExpense || ''],
      ['Other Costs (KES)', fuelData.otherCosts || ''],
      ['Fuel Balance', fuelData.fuelBalance || ''],
      ['Amount Earned (KES)', fuelData.amountEarned || ''],
      ['Net Profit (KES)', fuelData.netProfit || ''],
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
    a.download = `mileage-${currentMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully');
  };

  const buildSheetTsv = () => {
    const fuelData = currentLog.fuelData || {};
    // Layout matches the provided sheet with formulas included for the sheet only.
    // Columns: A Start | B End | C Mileage Start | D Mileage End | E Distance | F Total Distance | G Amount Paid | H FUEL CF | I Diesel amount | J Diesel Cost | K Petrol amount | L Petrol cost | M Total diesel use | N Total cost | O Fuel Balance | P Paid Job
    const headers = [
      'Start',
      'End',
      'Mileage Start',
      'Mileage End',
      'Distance',
      'Total Distance',
      'Amount Paid',
      'FUEL CF',
      'Diesel amount',
      'Diesel Cost',
      'Petrol amount',
      'Petrol cost',
      'Total diesel use',
      'Total cost',
      'Fuel Balance',
      'Paid Job',
    ];

    // Preface rows to mirror the sheet before the table.
    const paidJobsCount = currentLog.entries.filter(e => (e.amountPaid || 0) > 0).length;
    const metaRow1 = ['Date -', monthName, '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
    const metaRow2 = ['Start Mileage -', currentLog.startMileage ?? '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
    const metaRow3 = ['No of jobs -', paidJobsCount, '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
    const metaSpacer = Array(headers.length).fill('');

    // After meta + spacer + headers + helper, data begins at row 7 when pasted at A1.
    const startRow = 7;

    const rows = currentLog.entries.map((e, idx) => {
      const rowNumber = startRow + idx;
      const distance = e.distance || 0;
      const amount = e.amountPaid || 0;
      // Running total distance formula in column F
      const totalDistanceFormula = `=IF(E${rowNumber}="","",SUM(E$${startRow}:E${rowNumber}))`;
      return [
        e.start || '',
        e.end || '',
        e.mileageStart ?? '',
        e.mileageEnd ?? '',
        distance,
        totalDistanceFormula,
        amount,
        fuelData.fuelCf ?? '', // FUEL CF
        fuelData.dieselAmount ?? '',
        fuelData.dieselCost ?? '',
        fuelData.petrolAmount ?? '',
        fuelData.petrolCost ?? '',
        '', // Total diesel use (computed in totals row)
        fuelData.totalCost ?? '',
        fuelData.fuelBalance ?? '',
        (e.amountPaid || 0) > 0 ? 'PAID' : '',
      ];
    });

    const lastDataRow = startRow + (currentLog.entries.length || 1) - 1;
    const totalsRow = lastDataRow + 2; // leave a spacer like the example

    // Helper row for fuel consumption (km/L) feeding the total diesel use formula
    const fuelConsumptionHelper = Array(headers.length).fill('');
    fuelConsumptionHelper[11] = 'Fuel Consumption (km/L)'; // column L label
    fuelConsumptionHelper[12] = fuelData.fuelConsumptionRate ?? ''; // value goes in column M

    const spacer = Array(headers.length).fill('');

    const totals = Array(headers.length).fill('');
    // Total Distance label/value
    totals[4] = 'Total Distance'; // column E label
    totals[5] = `=SUM(E$${startRow}:E${lastDataRow})`; // column F total distance
    // Total Amount
    totals[6] = 'Total Amount'; // column G label
    totals[7] = `=SUM(G$${startRow}:G${lastDataRow})`; // column H value
    // Total diesel use (distance / fuel consumption entered in M5)
    const totalDistanceCell = `F${totalsRow}`;
    const consumptionCell = `M6`; // helper row is row 6 when pasted at A1
    totals[12] = `=IF(${consumptionCell}="", "", ${totalDistanceCell}/${consumptionCell})`;
    totals[13] = fuelData.totalCost ?? 'Total cost';
    totals[14] = fuelData.fuelBalance ?? 'Fuel Balance';
    totals[15] = `=COUNTIF(P$${startRow}:P${lastDataRow},"PAID")`; // paid jobs count

    // Fuel/expense summary block to appear neatly under the table
    const fuelSummaryHeader = (() => {
      const row = Array(headers.length).fill('');
      row[0] = 'FUEL & EXPENSES';
      return row;
    })();

    const makeSummaryRow = (label: string, value: number | string | null | undefined) => {
      const row = Array(headers.length).fill('');
      row[0] = label;
      row[1] = value ?? '';
      return row;
    };

    const fuelSummaryRows = [
      makeSummaryRow('Fuel CF', fuelData.fuelCf),
      makeSummaryRow('Diesel Amount (L)', fuelData.dieselAmount),
      makeSummaryRow('Diesel Cost (KES)', fuelData.dieselCost),
      makeSummaryRow('Petrol Amount (L)', fuelData.petrolAmount),
      makeSummaryRow('Petrol Cost (KES)', fuelData.petrolCost),
      makeSummaryRow('Fuel Consumption (km/L)', fuelData.fuelConsumptionRate),
      makeSummaryRow('Total Liters Used - Diesel', fuelData.totalLitersUsedDiesel ?? fuelData.totalLitersUsed),
      makeSummaryRow('Total Cost (KES)', fuelData.totalCost),
      makeSummaryRow('Total Expense (KES)', fuelData.totalExpense),
      makeSummaryRow('Other Costs (KES)', fuelData.otherCosts),
      makeSummaryRow('Amount Earned (KES)', fuelData.amountEarned),
      makeSummaryRow('Net Profit (KES)', fuelData.netProfit),
      makeSummaryRow('Fuel Balance', fuelData.fuelBalance),
    ];

    const output = [
      metaRow1,
      metaRow2,
      metaRow3,
      metaSpacer,
      headers,
      fuelConsumptionHelper,
      ...rows,
      spacer,
      totals,
      spacer,
      fuelSummaryHeader,
      ...fuelSummaryRows,
    ];

    return output.map(row => row.join('\t')).join('\n');
  };

  const handleCopyToClipboard = async () => {
    const tsvContent = buildSheetTsv();
    setLastCopyContent(tsvContent);

    try {
      await navigator.clipboard.writeText(tsvContent);
    } catch (err) {
      // Fallback: show modal with the content ready to copy manually
      setShowCopyFallback(true);
      return;
    }

    setCopied(true);
    toast.success('Copied to clipboard - paste into Google Sheets');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 150, 136);
    doc.text(`Monthly Report - ${monthName}`, pageWidth / 2, 20, { align: 'center' });

    // Summary section
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    let yPos = 35;

    doc.text('Summary:', 14, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.text(`Start Mileage: ${currentLog.startMileage?.toLocaleString() || 'N/A'}`, 14, yPos);
    yPos += 6;
    doc.text(`End Mileage: ${currentLog.endMileage?.toLocaleString() || 'N/A'}`, 14, yPos);
    yPos += 6;
    const paidJobs = currentLog.entries.filter(e => (e.amountPaid || 0) > 0).length;
    doc.text(`Total Jobs (paid): ${paidJobs}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Distance: ${currentLog.totalDistance.toLocaleString()} km`, 14, yPos);
    yPos += 6;
    const totalEarnings = currentLog.entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
    doc.text(`Total Earnings: KES ${totalEarnings.toLocaleString()}`, 14, yPos);
    yPos += 6;
    const totalFuelCost = (currentLog.fuelData.dieselCost || 0) + (currentLog.fuelData.petrolCost || 0);
    const netProfit = currentLog.fuelData.netProfit ??
      totalEarnings - (totalFuelCost + (currentLog.fuelData.totalExpense || 0) + (currentLog.fuelData.otherCosts || 0));
    doc.text(`Net Profit: KES ${netProfit.toLocaleString()}`, 14, yPos);
    yPos += 12;

    // Job Entries Table
    if (currentLog.entries.length > 0) {
      doc.setFontSize(12);
      doc.text('Job Entries:', 14, yPos);
      yPos += 4;

      let runningTotal = 0;
      const tableData = currentLog.entries.map(entry => {
        runningTotal += entry.distance || 0;
        return [
          entry.jobNumber.toString(),
          entry.orderNumber || '',
          entry.start,
          entry.end,
          (entry.distance || 0).toString(),
          `KES ${(entry.amountPaid || 0).toLocaleString()}`,
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Order', 'Start', 'End', 'Dist.', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 150, 136], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 12 },
          5: { halign: 'right' },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Fuel & Expenses
    if (currentLog.fuelData) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.text('Fuel & Expenses:', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      
      const fd = currentLog.fuelData;
      const fuelLines = [
        `Fuel C/F: ${fd.fuelCf || 0} L`,
        `Diesel: ${fd.dieselAmount || 0} L / KES ${(fd.dieselCost || 0).toLocaleString()}`,
        `Petrol: ${fd.petrolAmount || 0} L / KES ${(fd.petrolCost || 0).toLocaleString()}`,
        `Fuel Consumption (km/L): ${fd.fuelConsumptionRate || 0}`,
        `Total Liters Used - Diesel: ${fd.totalLitersUsedDiesel || fd.totalLitersUsed || 0} L`,
        `Total Fuel Cost: KES ${(fd.totalCost || 0).toLocaleString()}`,
        `Total Expense: KES ${(fd.totalExpense || 0).toLocaleString()}`,
        `Other Costs: KES ${(fd.otherCosts || 0).toLocaleString()}`,
        `Fuel Balance: ${fd.fuelBalance || 0} L`,
        `Amount Earned: KES ${(fd.amountEarned || 0).toLocaleString()}`,
        `Net Profit: KES ${(fd.netProfit || netProfit).toLocaleString()}`,
      ];

      fuelLines.forEach(line => {
        doc.text(line, 14, yPos);
        yPos += 6;
      });
    }

    // Water Fill Sites
    if (waterFillSites.length > 0) {
      yPos += 6;
      doc.setFontSize(12);
      doc.text('Water Fill Sites:', 14, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.text(waterFillSites.map(s => s.name).join(', '), 14, yPos);
      yPos += 10;
    }

    // Misdemeanors
    if (currentLog.misdemeanors && currentLog.misdemeanors.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.text('Misdemeanors:', 14, yPos);
      yPos += 4;

      const misData = currentLog.misdemeanors.map(m => [
        format(new Date(m.date), 'dd/MM/yyyy'),
        m.type,
        m.description || '',
        `KES ${(m.fine || 0).toLocaleString()}`,
        m.resolved ? 'Yes' : 'No',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Type', 'Description', 'Fine', 'Resolved']],
        body: misData,
        theme: 'striped',
        headStyles: { fillColor: [220, 53, 69], textColor: 255 },
        styles: { fontSize: 9 },
      });
    }

    // Save
    doc.save(`mileage-report-${currentMonth}.pdf`);
    toast.success('PDF report downloaded');
  };

  const totalDistance = currentLog.entries.reduce((sum, e) => sum + (e.distance || 0), 0);
  const totalAmount = currentLog.entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);

  return (
    <>
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center gap-2 mb-4">
        <FileSpreadsheet className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Export Data</h2>
      </div>

      <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-base font-medium text-foreground">
                {monthName}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentLog.entries.length} jobs • {totalDistance.toLocaleString()} km • KES {totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="default" onClick={handleExportPDF} className="gap-2">
                <FileText className="w-4 h-4" />
                PDF Report
              </Button>
              <Button type="button" variant="outline" onClick={handleCopyToClipboard} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy for Sheets'}
              </Button>
              <Button variant="outline" onClick={handleDownloadCSV} className="gap-2">
                <Download className="w-4 h-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* Copy for Sheet highlight */}
          <div className="p-4 rounded-lg border border-dashed border-primary/40 bg-primary/5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-primary">Copy for Sheet</p>
                <p className="text-xs text-muted-foreground">
                  Copies all table values (including water fill & parking flags)
                </p>
              </div>
              <Button type="button" variant="outline" onClick={handleCopyToClipboard} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  const tsvContent = buildSheetTsv();
                  setLastCopyContent(tsvContent);
                  setShowCopyFallback(true);
                }}
              >
                Open copy data
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Includes job entries, fuel/expense data, misdemeanors, and water fill sites
        </p>
      </div>
    </div>

    <Dialog open={showCopyFallback} onOpenChange={setShowCopyFallback}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manual Copy</DialogTitle>
          <DialogDescription>
            Your browser blocked clipboard access. Select all and copy the data below, then paste into Google Sheets.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={lastCopyContent}
          readOnly
          className="h-64 font-mono text-xs"
          onFocus={(e) => e.currentTarget.select()}
        />
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([lastCopyContent], { type: 'text/tab-separated-values' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `mileage-${currentMonth}.tsv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download .tsv
          </Button>
          <Button onClick={() => setShowCopyFallback(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ExportPanel;
