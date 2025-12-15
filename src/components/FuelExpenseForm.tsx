import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Fuel, DollarSign } from 'lucide-react';
import { FuelData } from '@/types/mileage';
import { toast } from 'sonner';

interface FuelExpenseFormProps {
  fuelData: FuelData;
  onSave: (data: FuelData) => void;
}

export const FuelExpenseForm = ({ fuelData, onSave }: FuelExpenseFormProps) => {
  const [formData, setFormData] = useState<FuelData>(fuelData);

  useEffect(() => {
    setFormData(fuelData);
  }, [fuelData]);

  const handleChange = (field: keyof FuelData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value ? Number(value) : null,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    toast.success('Fuel & expense data saved');
  };

  // Calculate totals automatically
  const calculatedTotalLiters = (formData.dieselAmount || 0) + (formData.petrolAmount || 0);
  const calculatedTotalCost = (formData.dieselCost || 0) + (formData.petrolCost || 0);

  const fields: { key: keyof FuelData; label: string; prefix?: string; suffix?: string }[] = [
    { key: 'fuelCf', label: 'Fuel CF' },
    { key: 'dieselAmount', label: 'Diesel Amount', suffix: 'L' },
    { key: 'dieselCost', label: 'Diesel Cost', prefix: '$' },
    { key: 'petrolAmount', label: 'Petrol Amount', suffix: 'L' },
    { key: 'petrolCost', label: 'Petrol Cost', prefix: '$' },
    { key: 'totalLitersUsed', label: 'Total Liters Used', suffix: 'L' },
    { key: 'totalCost', label: 'Total Cost', prefix: '$' },
    { key: 'totalExpense', label: 'Total Expense', prefix: '$' },
    { key: 'fuelBalance', label: 'Fuel Balance', prefix: '$' },
    { key: 'amountEarned', label: 'Amount Earned', prefix: '$' },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5 text-primary" />
          Fuel & Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {fields.map(({ key, label, prefix, suffix }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-xs">{label}</Label>
              <div className="relative">
                {prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {prefix}
                  </span>
                )}
                <Input
                  id={key}
                  type="number"
                  step="0.01"
                  value={formData[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={prefix ? 'pl-7' : ''}
                  placeholder="0"
                />
                {suffix && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {suffix}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Auto-calculated hints */}
        <div className="flex items-center gap-6 p-3 bg-muted rounded-lg text-sm">
          <div>
            <span className="text-muted-foreground">Auto Total Liters:</span>
            <span className="ml-2 font-medium">{calculatedTotalLiters} L</span>
          </div>
          <div>
            <span className="text-muted-foreground">Auto Total Cost:</span>
            <span className="ml-2 font-medium">${calculatedTotalCost}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{formData.totalLitersUsed || calculatedTotalLiters} L</div>
            <div className="text-xs text-muted-foreground">Total Fuel</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">${formData.totalCost || calculatedTotalCost}</div>
            <div className="text-xs text-muted-foreground">Total Cost</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">${formData.totalExpense || 0}</div>
            <div className="text-xs text-muted-foreground">Total Expense</div>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
            <div className="text-2xl font-bold text-primary">${formData.amountEarned || 0}</div>
            <div className="text-xs text-muted-foreground">Amount Earned</div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <DollarSign className="w-4 h-4 mr-2" />
          Save Fuel & Expense Data
        </Button>
      </CardContent>
    </Card>
  );
};
