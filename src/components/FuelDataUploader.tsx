import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Check } from "lucide-react";
import { Button } from "./ui/button";
import { FuelData } from "@/types/mileage";
import { toast } from "sonner";

interface FuelDataUploaderProps {
  onFuelDataLoaded: (data: FuelData) => void;
  fuelData: FuelData;
}

const FuelDataUploader = ({ onFuelDataLoaded, fuelData }: FuelDataUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): FuelData => {
    const lines = text.trim().split('\n');
    const data: FuelData = {
      fuelCf: null,
      dieselAmount: null,
      dieselCost: null,
      petrolAmount: null,
      petrolCost: null,
      totalLitersUsed: null,
      totalCost: null,
      totalExpense: null,
      fuelBalance: null,
      amountEarned: null,
    };

    // Parse CSV - supports header row or key-value format
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim().toLowerCase());
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parseFloat(parts[1]) || null;

        if (key.includes('fuel cf') || key === 'fuelcf') data.fuelCf = value;
        else if (key.includes('diesel amount') || key === 'dieselamount') data.dieselAmount = value;
        else if (key.includes('diesel cost') || key === 'dieselcost') data.dieselCost = value;
        else if (key.includes('petrol amount') || key === 'petrolamount') data.petrolAmount = value;
        else if (key.includes('petrol cost') || key === 'petrolcost') data.petrolCost = value;
        else if (key.includes('total liters') || key === 'totallitersused') data.totalLitersUsed = value;
        else if (key.includes('total cost') && !key.includes('expense') || key === 'totalcost') data.totalCost = value;
        else if (key.includes('total expense') || key === 'totalexpense') data.totalExpense = value;
        else if (key.includes('fuel balance') || key === 'fuelbalance') data.fuelBalance = value;
        else if (key.includes('amount earned') || key === 'amountearned') data.amountEarned = value;
      }
    }

    return data;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      onFuelDataLoaded(parsedData);
      toast.success('Fuel data loaded successfully');
    } catch (error) {
      toast.error('Failed to parse CSV file');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const hasData = Object.values(fuelData).some(v => v !== null);

  return (
    <div className="glass-card p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <FileSpreadsheet className="w-4 h-4 text-primary" />
        <h3 className="font-medium text-foreground text-sm">Fuel & Expenses</h3>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="w-full border-dashed"
      >
        {isProcessing ? (
          <>Processing...</>
        ) : hasData ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Data Loaded - Click to Update
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </>
        )}
      </Button>

      {hasData && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {fuelData.dieselAmount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diesel:</span>
              <span className="font-mono">{fuelData.dieselAmount}L</span>
            </div>
          )}
          {fuelData.petrolAmount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Petrol:</span>
              <span className="font-mono">{fuelData.petrolAmount}L</span>
            </div>
          )}
          {fuelData.totalCost && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Cost:</span>
              <span className="font-mono">${fuelData.totalCost}</span>
            </div>
          )}
          {fuelData.amountEarned && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Earned:</span>
              <span className="font-mono text-primary">${fuelData.amountEarned}</span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        CSV format: key,value (e.g., "Diesel Amount,45")
      </p>
    </div>
  );
};

export default FuelDataUploader;
