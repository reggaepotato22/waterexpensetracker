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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let yPos = 20;
    
    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      return yPos;
    };

    // Title with background color
    doc.setFillColor(0, 150, 136);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(`Monthly Report - ${monthName}`, pageWidth / 2, 18, { align: 'center' });
    
    yPos = 40;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    // Summary Box with border
    doc.setDrawColor(0, 150, 136);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 50);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 150, 136);
    doc.text('SUMMARY', margin + 5, yPos + 8);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    let summaryY = yPos + 18;
    
    const startMileage = currentLog.startMileage?.toLocaleString() || 'N/A';
    const endMileage = currentLog.endMileage?.toLocaleString() || 'N/A';
    const paidJobs = currentLog.entries.filter(e => (e.amountPaid || 0) > 0).length;
    const totalJobs = currentLog.entries.length;
    const totalDistance = currentLog.totalDistance.toLocaleString();
    const totalEarnings = currentLog.entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
    const totalFuelCost = (currentLog.fuelData.dieselCost || 0) + (currentLog.fuelData.petrolCost || 0);
    const totalExpenses = totalFuelCost + (currentLog.fuelData.totalExpense || 0) + (currentLog.fuelData.otherCosts || 0);
    const netProfit = currentLog.fuelData.netProfit ?? (totalEarnings - totalExpenses);

    // Two column layout for summary
    doc.text(`Start Mileage: ${startMileage}`, margin + 5, summaryY);
    doc.text(`End Mileage: ${endMileage}`, pageWidth / 2 + 5, summaryY);
    summaryY += 7;
    
    doc.text(`Total Jobs: ${totalJobs}`, margin + 5, summaryY);
    doc.text(`Paid Jobs: ${paidJobs}`, pageWidth / 2 + 5, summaryY);
    summaryY += 7;
    
    doc.text(`Total Distance: ${totalDistance} km`, margin + 5, summaryY);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 150, 136);
    doc.text(`Total Earnings: KES ${totalEarnings.toLocaleString()}`, pageWidth / 2 + 5, summaryY);
    
    yPos = summaryY + 15;

    // Fuel & Expenses Section (moved to top)
    yPos = checkPageBreak(80);
    
    doc.setDrawColor(0, 150, 136);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 70);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 150, 136);
    doc.text('FUEL & EXPENSES', margin + 5, yPos + 8);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    let fuelY = yPos + 18;
    
    const fd = currentLog.fuelData;
    const leftCol = margin + 5;
    const rightCol = pageWidth / 2 + 5;
    
    // Two column layout
    doc.text(`Fuel C/F: ${fd.fuelCf || 0} L`, leftCol, fuelY);
    doc.text(`Diesel Amount: ${fd.dieselAmount || 0} L`, rightCol, fuelY);
    fuelY += 6;
    
    doc.text(`Diesel Cost: KES ${(fd.dieselCost || 0).toLocaleString()}`, leftCol, fuelY);
    doc.text(`Petrol Amount: ${fd.petrolAmount || 0} L`, rightCol, fuelY);
    fuelY += 6;
    
    doc.text(`Petrol Cost: KES ${(fd.petrolCost || 0).toLocaleString()}`, leftCol, fuelY);
    doc.text(`Fuel Consumption: ${fd.fuelConsumptionRate || 0} km/L`, rightCol, fuelY);
    fuelY += 6;
    
    doc.text(`Total Liters Used: ${fd.totalLitersUsedDiesel || fd.totalLitersUsed || 0} L`, leftCol, fuelY);
    doc.text(`Total Fuel Cost: KES ${(fd.totalCost || 0).toLocaleString()}`, rightCol, fuelY);
    fuelY += 6;
    
    doc.text(`Total Expense: KES ${(fd.totalExpense || 0).toLocaleString()}`, leftCol, fuelY);
    doc.text(`Other Costs: KES ${(fd.otherCosts || 0).toLocaleString()}`, rightCol, fuelY);
    fuelY += 6;
    
    doc.text(`Fuel Balance: ${fd.fuelBalance || 0} L`, leftCol, fuelY);
    doc.text(`Amount Earned: KES ${(fd.amountEarned || 0).toLocaleString()}`, rightCol, fuelY);
    
    yPos = fuelY + 15;

    // Financial Summary Box (moved to top, right after Fuel & Expenses)
    yPos = checkPageBreak(40);
    
    doc.setDrawColor(0, 150, 136);
    doc.setLineWidth(1);
    doc.setFillColor(240, 248, 247);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 35, 'FD');
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 150, 136);
    doc.text('FINANCIAL SUMMARY', margin + 5, yPos + 10);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    let finY = yPos + 20;
    
    doc.text(`Total Earnings: KES ${totalEarnings.toLocaleString()}`, leftCol, finY);
    doc.text(`Total Expenses: KES ${totalExpenses.toLocaleString()}`, rightCol, finY);
    finY += 8;
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 150, 136);
    doc.text(`Net Profit: KES ${netProfit.toLocaleString()}`, leftCol, finY);
    
    yPos = finY + 15;

    // Job Entries Table (moved after Financial Summary)
    if (currentLog.entries.length > 0) {
      yPos = checkPageBreak(30);
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 150, 136);
      doc.text('JOB ENTRIES', margin, yPos);
      yPos += 8;

      const tableData = currentLog.entries.map(entry => {
        const distance = entry.distance || 0;
        const amount = entry.amountPaid || 0;
        return [
          entry.jobNumber.toString(),
          entry.orderNumber || '-',
          entry.start || '-',
          entry.end || '-',
          entry.mileageStart?.toString() || '-',
          entry.mileageEnd?.toString() || '-',
          distance.toString(),
          amount > 0 ? `KES ${amount.toLocaleString()}` : '-',
          entry.isWaterFill ? 'Yes' : '',
          entry.isParking ? 'Yes' : '',
        ];
      });

      // Add totals row
      const totalRow = [
        '',
        'TOTAL',
        '',
        '',
        '',
        '',
        totalDistance,
        `KES ${totalEarnings.toLocaleString()}`,
        '',
        '',
      ];
      tableData.push(totalRow);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Order #', 'Start', 'End', 'Mi. Start', 'Mi. End', 'Distance', 'Amount', 'Water', 'Park']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [0, 150, 136], 
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: { fontSize: 8, cellPadding: 2 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 20, halign: 'right' },
          6: { cellWidth: 20, halign: 'right' },
          7: { cellWidth: 30, halign: 'right' },
          8: { cellWidth: 15, halign: 'center' },
          9: { cellWidth: 15, halign: 'center' },
        },
        margin: { left: margin, right: margin },
        didParseCell: (data: any) => {
          // Style the totals row
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
            if (data.column.index === 1 || data.column.index === 6 || data.column.index === 7) {
              data.cell.styles.textColor = [0, 150, 136];
            }
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 12;
    }

    // Water Fill Sites
    if (waterFillSites.length > 0) {
      yPos = checkPageBreak(20);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 150, 136);
      doc.text('Water Fill Sites:', margin, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(waterFillSites.map(s => s.name).join(', '), margin, yPos);
      yPos += 12;
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
