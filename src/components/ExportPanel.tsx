import { Download, FileSpreadsheet, Copy, Check, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { MonthlyLog, WaterFillSite } from "@/types/mileage";
import { useState } from "react";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportPanelProps {
  currentLog: MonthlyLog;
  currentMonth: string;
  waterFillSites: WaterFillSite[];
}

const ExportPanel = ({ currentLog, currentMonth, waterFillSites }: ExportPanelProps) => {
  const [copied, setCopied] = useState(false);
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
      ['Total Liters Used', fuelData.totalLitersUsed || ''],
      ['Total Cost (KES)', fuelData.totalCost || ''],
      ['Total Expense (KES)', fuelData.totalExpense || ''],
      ['Fuel Balance', fuelData.fuelBalance || ''],
      ['Amount Earned (KES)', fuelData.amountEarned || ''],
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

  const handleCopyToClipboard = async () => {
    const headers = ['Job #', 'Order #', 'Start', 'End', 'Mileage Start', 'Mileage End', 'Distance', 'Amount (KES)'];
    let runningTotal = 0;
    
    const rows = currentLog.entries.map(e => {
      runningTotal += e.distance || 0;
      return [
        e.jobNumber,
        e.orderNumber || '',
        e.start,
        e.end,
        e.mileageStart || '',
        e.mileageEnd || '',
        e.distance || 0,
        e.amountPaid || 0,
      ];
    });

    const data = [headers, ...rows];
    const tsvContent = data.map(row => row.join('\t')).join('\n');

    await navigator.clipboard.writeText(tsvContent);
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
    doc.text(`Total Jobs: ${currentLog.entries.length}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Distance: ${currentLog.totalDistance.toLocaleString()} km`, 14, yPos);
    yPos += 6;
    const totalEarnings = currentLog.entries.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
    doc.text(`Total Earnings: KES ${totalEarnings.toLocaleString()}`, 14, yPos);
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
        `Total Liters Used: ${fd.totalLitersUsed || 0} L`,
        `Total Fuel Cost: KES ${(fd.totalCost || 0).toLocaleString()}`,
        `Total Expense: KES ${(fd.totalExpense || 0).toLocaleString()}`,
        `Fuel Balance: ${fd.fuelBalance || 0} L`,
        `Amount Earned: KES ${(fd.amountEarned || 0).toLocaleString()}`,
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
              <Button variant="outline" onClick={handleCopyToClipboard} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy for Sheets'}
              </Button>
              <Button variant="outline" onClick={handleDownloadCSV} className="gap-2">
                <Download className="w-4 h-4" />
                CSV
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Includes job entries, fuel/expense data, misdemeanors, and water fill sites
        </p>
      </div>
    </div>
  );
};

export default ExportPanel;
