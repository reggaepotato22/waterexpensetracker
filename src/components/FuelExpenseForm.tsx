import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Fuel, Save, Users } from 'lucide-react';
import { FuelData } from '@/types/mileage';
import { toast } from 'sonner';
import { parse, format, isLastDayOfMonth } from 'date-fns';

interface FuelExpenseFormProps {
  fuelData: FuelData;
  totalDistance: number;
  currentMonth: string; // Format: "YYYY-MM"
  onSave: (data: FuelData) => void;
}

export const FuelExpenseForm = ({ fuelData, totalDistance, currentMonth, onSave }: FuelExpenseFormProps) => {
  const [formData, setFormData] = useState<FuelData>(fuelData);

  useEffect(() => {
    setFormData(fuelData);
  }, [fuelData]);

  // Check if today is the last day of the current month
  const monthDate = parse(currentMonth, 'yyyy-MM', new Date());
  const today = new Date();
  const isCurrentMonth = format(today, 'yyyy-MM') === currentMonth;
  const isLastDay = isCurrentMonth && isLastDayOfMonth(today);

  const handleChange = (field: keyof FuelData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value ? Number(value) : null,
    }));
  };

  const handleSave = () => {
    const dieselUnitCost =
      formData.dieselAmount && formData.dieselAmount > 0
        ? (formData.dieselCost || 0) / formData.dieselAmount
        : 0;
    const usageCost = dieselUnitCost * calculatedLitersUsedDiesel;
    const monthlySalary = formData.monthlySalary || 0;
    const netProfit =
      (formData.amountEarned || 0) -
      (usageCost +
        (formData.dieselCost || 0) +
        (formData.petrolCost || 0) +
        (formData.totalExpense || 0) +
        (formData.otherCosts || 0) +
        monthlySalary);

    const payload = {
      ...formData,
      totalLitersUsedDiesel: calculatedLitersUsedDiesel,
      totalLitersUsed: formData.totalLitersUsed ?? calculatedTotalLiters,
      netProfit,
    };
    onSave(payload);
    toast.success('Fuel & expense data saved');
  };

  const calculatedTotalLiters = (formData.dieselAmount || 0) + (formData.petrolAmount || 0);
  const calculatedTotalCost = (formData.dieselCost || 0) + (formData.petrolCost || 0);
  const calculatedLitersUsedDiesel =
    formData.fuelConsumptionRate && formData.fuelConsumptionRate > 0
      ? Number((totalDistance / formData.fuelConsumptionRate).toFixed(2))
      : formData.totalLitersUsedDiesel || 0;

  const fields: { key: keyof FuelData; label: string; prefix?: string; suffix?: string; placeholder?: string }[] = [
    { key: 'fuelCf', label: 'Fuel CF' },
    { key: 'dieselAmount', label: 'Diesel Amount', suffix: 'L' },
    { key: 'dieselCost', label: 'Diesel Cost', prefix: 'KES' },
    { key: 'petrolAmount', label: 'Petrol Amount', suffix: 'L' },
    { key: 'petrolCost', label: 'Petrol Cost', prefix: 'KES' },
    { key: 'fuelConsumptionRate', label: 'Fuel Consumption (km/L)', suffix: 'km/L', placeholder: 'e.g. 6' },
    { key: 'totalLitersUsedDiesel', label: 'Total Liters Used - Diesel', suffix: 'L' },
    { key: 'totalCost', label: 'Total Cost', prefix: 'KES' },
    { key: 'totalExpense', label: 'Total Expense', prefix: 'KES' },
    { key: 'otherCosts', label: 'Other Costs', prefix: 'KES' },
    { key: 'fuelBalance', label: 'Fuel Balance', prefix: 'KES' },
    { key: 'amountEarned', label: 'Amount Earned', prefix: 'KES' },
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
          {fields.map(({ key, label, prefix, suffix, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-xs">{label}</Label>
              <div className="relative">
                {prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                    {prefix}
                  </span>
                )}
                <Input
                  id={key}
                  type="number"
                  step="0.01"
                  value={formData[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={prefix ? 'pl-12' : ''}
                  placeholder={placeholder || '0'}
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
        <div className="flex items-center gap-6 p-3 bg-muted rounded-lg text-sm flex-wrap">
          <div>
            <span className="text-muted-foreground">Auto Total Liters:</span>
            <span className="ml-2 font-medium">{calculatedTotalLiters} L</span>
          </div>
          <div>
            <span className="text-muted-foreground">Auto Total Cost:</span>
            <span className="ml-2 font-medium">KES {calculatedTotalCost.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Distance-based Diesel Use:</span>
            <span className="ml-2 font-medium">{calculatedLitersUsedDiesel} L</span>
          </div>
        </div>

        {/* Monthly Salary Input - Show on last day of month */}
        {isLastDay && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <Label htmlFor="monthlySalary" className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Monthly Salary (Two Lorry Drivers)
              </Label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                KES
              </span>
              <Input
                id="monthlySalary"
                type="number"
                step="0.01"
                value={formData.monthlySalary || ''}
                onChange={(e) => handleChange('monthlySalary', e.target.value)}
                className="pl-12"
                placeholder="Enter total monthly salary for both drivers"
              />
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
              Last day of the month - Enter the total monthly salary for both lorry drivers
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{calculatedLitersUsedDiesel || formData.totalLitersUsed || calculatedTotalLiters} L</div>
            <div className="text-xs text-muted-foreground">Total Fuel (Diesel)</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">KES {(formData.totalCost || calculatedTotalCost).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Cost</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">KES {(formData.totalExpense || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Expense</div>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
            <div className="text-2xl font-bold text-primary">KES {(formData.amountEarned || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Amount Earned</div>
          </div>
        </div>

        {formData.monthlySalary && formData.monthlySalary > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Monthly Salary</div>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
              KES {formData.monthlySalary.toLocaleString()}
            </div>
          </div>
        )}

        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Fuel & Expense Data
        </Button>
      </CardContent>
    </Card>
  );
};
