import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, FileCheck, Upload } from "lucide-react";
import { MileageEntry, CSVDelivery } from "@/types/mileage";
import { toast } from "sonner";

type ComparisonStatus = "matched" | "missing" | "extra";

interface ComparisonRow {
  orderNumber: string;
  customer: string;
  earning: number;
  status: ComparisonStatus;
  amountMatches?: boolean;
}

interface CSVComparisonProps {
  entries: MileageEntry[];
}

const parseCsv = (text: string): CSVDelivery[] => {
  const lines = text.split("\n").filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const orderIdx = headers.findIndex((h) => h.includes("order"));
  const customerIdx = headers.findIndex((h) => h.includes("customer"));
  const earningIdx = headers.findIndex((h) => h.includes("earning") || h.includes("amount"));

  if (orderIdx === -1 || earningIdx === -1) {
    throw new Error("CSV must contain order and earning columns");
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return {
      key: cols[orderIdx]?.trim() || "",
      orderNumber: cols[orderIdx]?.trim() || "",
      date: "",
      customer: cols[customerIdx]?.trim() || "",
      volume: 0,
      earning: parseFloat(cols[earningIdx] || "0"),
    };
  });
};

export const CSVComparison = ({ entries }: CSVComparisonProps) => {
  const [rows, setRows] = useState<ComparisonRow[]>([]);

  const counts = useMemo(() => {
    return {
      matched: rows.filter((r) => r.status === "matched").length,
      missing: rows.filter((r) => r.status === "missing").length,
      extra: rows.filter((r) => r.status === "extra").length,
    };
  }, [rows]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const csvDeliveries = parseCsv(text);
        const comparisons: ComparisonRow[] = [];

        csvDeliveries.forEach((csv) => {
          const matchedEntry = entries.find((entry) => entry.orderNumber === csv.orderNumber);
          if (matchedEntry) {
            comparisons.push({
              orderNumber: csv.orderNumber,
              customer: csv.customer,
              earning: csv.earning,
              status: "matched",
              amountMatches: matchedEntry.amountPaid === csv.earning,
            });
          } else {
            comparisons.push({
              orderNumber: csv.orderNumber,
              customer: csv.customer,
              earning: csv.earning,
              status: "missing",
            });
          }
        });

        entries.forEach((entry) => {
          if (entry.orderNumber && !csvDeliveries.find((c) => c.orderNumber === entry.orderNumber)) {
            comparisons.push({
              orderNumber: entry.orderNumber,
              customer: entry.customer || "",
              earning: entry.amountPaid || 0,
              status: "extra",
            });
          }
        });

        setRows(comparisons);
        toast.success("Comparison ready");
      } catch (error: any) {
        toast.error(error.message || "Failed to parse CSV");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-primary" />
          External CSV Comparison
        </CardTitle>
        <label className="cursor-pointer">
          <input type="file" accept=".csv" onChange={handleUpload} className="hidden" />
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload CSV
          </Button>
        </label>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Badge className="bg-success/15 text-success border-success/40 px-3 py-1">
            <Check className="w-3 h-3 mr-1" />
            {counts.matched} Matched
          </Badge>
          <Badge className="bg-destructive/15 text-destructive border-destructive/30 px-3 py-1">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {counts.missing} Missing
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {counts.extra} Extra
          </Badge>
        </div>

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Earning (KES)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.status}-${row.orderNumber}`}>
                    <TableCell className="font-mono">{row.orderNumber}</TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell className="text-right font-mono">
                      KES {row.earning.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {row.status === "matched" && row.amountMatches && (
                        <Badge variant="default" className="bg-success text-success-foreground">
                          <Check className="w-3 h-3 mr-1" />
                          Matched
                        </Badge>
                      )}
                      {row.status === "matched" && !row.amountMatches && (
                        <Badge variant="outline" className="border-warning text-warning">
                          Amount differs
                        </Badge>
                      )}
                      {row.status === "missing" && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Missing
                        </Badge>
                      )}
                      {row.status === "extra" && (
                        <Badge variant="secondary">Extra</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Upload a dispatch/company CSV to compare with your monthly jobs.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CSVComparison;

