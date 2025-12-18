import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Fuel, Save, Users } from 'lucide-react';
import { FuelData } from '@/types/mileage';
import { toast } from 'sonner';
import { parse, format, isLastDayOfMonth } from 'date-fns';
import { useEffect } from 'react';

interface FuelExpenseFormProps {
  fuelData: FuelData;
  totalDistance: number;
  currentMonth: string; // Format: "YYYY-MM"
  selectedDay?: Date | null;
  onSave: (data: FuelData) => void;
}

export const FuelExpenseForm = ({ fuelData, totalDistance, currentMonth, selectedDay, onSave }: FuelExpenseFormProps) => {
  // Daily fuel data (resets each day)
  const [dailyFuelData, setDailyFuelData] = useState<Partial<FuelData>>({});
  
  // Get fuel consumption rate from monthly data (persists)
  const fuelConsumptionRate = fuelData.fuelConsumptionRate;
  
  // Initialize form data with daily values (default to 0) and persisted fuel consumption rate
  const [formData, setFormData] = useState<FuelData>(() => ({
    ...fuelData,
    fuelCf: dailyFuelData.fuelCf ?? 0,
    dieselAmount: dailyFuelData.dieselAmount ?? 0,
    dieselCost: dailyFuelData.dieselCost ?? 0,
    petrolAmount: dailyFuelData.petrolAmount ?? 0,
    petrolCost: dailyFuelData.petrolCost ?? 0,
    totalLitersUsed: dailyFuelData.totalLitersUsed ?? 0,
    totalCost: dailyFuelData.totalCost ?? 0,
    totalExpense: dailyFuelData.totalExpense ?? 0,
    fuelBalance: dailyFuelData.fuelBalance ?? 0,
    amountEarned: dailyFuelData.amountEarned ?? 0,
    otherCosts: dailyFuelData.otherCosts ?? 0,
    fuelConsumptionRate: fuelConsumptionRate ?? null,
    totalLitersUsedDiesel: dailyFuelData.totalLitersUsedDiesel ?? 0,
    monthlySalary: fuelData.monthlySalary ?? null,
    netProfit: null,
  }));

  // Reset daily values when day changes (keep fuel consumption rate)
  useEffect(() => {
    if (selectedDay) {
      const dayKey = format(selectedDay, 'yyyy-MM-dd');
      const stored = localStorage.getItem(`daily-fuel-${dayKey}`);
      
      if (stored) {
        try {
          const saved = JSON.parse(stored);
          setDailyFuelData(saved);
          // Calculate totalCost from dieselCost + petrolCost
          const savedTotalCost = (saved.dieselCost || 0) + (saved.petrolCost || 0);
          setFormData({
            ...fuelData,
            ...saved,
            totalCost: savedTotalCost,
            fuelConsumptionRate: fuelConsumptionRate ?? fuelData.fuelConsumptionRate,
            monthlySalary: fuelData.monthlySalary ?? null,
            netProfit: null,
          });
        } catch (e) {
          // Reset to 0 if parse fails
          resetDailyData();
        }
      } else {
        resetDailyData();
      }
    } else {
      // No day selected, use monthly totals
      setFormData(fuelData);
    }
  }, [selectedDay, fuelConsumptionRate, fuelData.monthlySalary, fuelData]);

  const resetDailyData = () => {
    const resetData: Partial<FuelData> = {
      fuelCf: 0,
      dieselAmount: 0,
      dieselCost: 0,
      petrolAmount: 0,
      petrolCost: 0,
      totalLitersUsed: 0,
      totalCost: 0,
      totalExpense: 0,
      fuelBalance: 0,
      amountEarned: 0,
      otherCosts: 0,
      totalLitersUsedDiesel: 0,
    };
    setDailyFuelData(resetData);
    setFormData({
      ...fuelData,
      ...resetData,
      fuelConsumptionRate: fuelConsumptionRate ?? fuelData.fuelConsumptionRate,
      monthlySalary: fuelData.monthlySalary ?? null,
      netProfit: null,
    });
  };

  // Check if today is the last day of the current month
  const monthDate = parse(currentMonth, 'yyyy-MM', new Date());
  const today = new Date();
  const isCurrentMonth = format(today, 'yyyy-MM') === currentMonth;
  const isLastDay = isCurrentMonth && isLastDayOfMonth(today);

  const handleChange = (field: keyof FuelData, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value ? Number(value) : null,
      };
      
      // Auto-calculate totalCost when dieselCost or petrolCost changes
      if (field === 'dieselCost' || field === 'petrolCost') {
        const dieselCost = field === 'dieselCost' ? (value ? Number(value) : 0) : (prev.dieselCost || 0);
        const petrolCost = field === 'petrolCost' ? (value ? Number(value) : 0) : (prev.petrolCost || 0);
        updated.totalCost = dieselCost + petrolCost;
      }
      
      return updated;
    });
  };

  const handleSave = () => {
    if (selectedDay) {
      // Save daily data to localStorage
      const dayKey = format(selectedDay, 'yyyy-MM-dd');
      
      // Calculate totalCost from dieselCost + petrolCost for daily data
      const dailyDieselCost = formData.dieselCost ?? 0;
      const dailyPetrolCost = formData.petrolCost ?? 0;
      const dailyTotalCost = dailyDieselCost + dailyPetrolCost;
      
      const dailyData: Partial<FuelData> = {
        fuelCf: formData.fuelCf ?? 0,
        dieselAmount: formData.dieselAmount ?? 0,
        dieselCost: dailyDieselCost,
        petrolAmount: formData.petrolAmount ?? 0,
        petrolCost: dailyPetrolCost,
        totalLitersUsed: formData.totalLitersUsed ?? 0,
        totalCost: dailyTotalCost, // Calculate from dieselCost + petrolCost
        totalExpense: formData.totalExpense ?? 0,
        fuelBalance: formData.fuelBalance ?? 0,
        amountEarned: formData.amountEarned ?? 0,
        otherCosts: formData.otherCosts ?? 0,
        totalLitersUsedDiesel: calculatedLitersUsedDiesel,
      };
      
      // Get previously saved daily data to avoid double-counting
      const savedKey = `daily-fuel-saved-${dayKey}`;
      const previouslySaved = localStorage.getItem(savedKey);
      let previousDailyData: Partial<FuelData> = {};
      if (previouslySaved) {
        try {
          previousDailyData = JSON.parse(previouslySaved);
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Calculate difference (new values - previously saved values)
      // For totalCost, calculate from dieselCost and petrolCost differences
      const dieselCostDiff = (dailyData.dieselCost || 0) - (previousDailyData.dieselCost || 0);
      const petrolCostDiff = (dailyData.petrolCost || 0) - (previousDailyData.petrolCost || 0);
      const totalCostDiff = dieselCostDiff + petrolCostDiff;
      
      const difference: Partial<FuelData> = {
        fuelCf: (dailyData.fuelCf || 0) - (previousDailyData.fuelCf || 0),
        dieselAmount: (dailyData.dieselAmount || 0) - (previousDailyData.dieselAmount || 0),
        dieselCost: dieselCostDiff,
        petrolAmount: (dailyData.petrolAmount || 0) - (previousDailyData.petrolAmount || 0),
        petrolCost: petrolCostDiff,
        totalLitersUsed: (dailyData.totalLitersUsed || 0) - (previousDailyData.totalLitersUsed || 0),
        totalCost: totalCostDiff, // Calculate from dieselCost + petrolCost differences
        totalExpense: (dailyData.totalExpense || 0) - (previousDailyData.totalExpense || 0),
        fuelBalance: (dailyData.fuelBalance || 0) - (previousDailyData.fuelBalance || 0),
        amountEarned: (dailyData.amountEarned || 0) - (previousDailyData.amountEarned || 0),
        otherCosts: (dailyData.otherCosts || 0) - (previousDailyData.otherCosts || 0),
        totalLitersUsedDiesel: (dailyData.totalLitersUsedDiesel || 0) - (previousDailyData.totalLitersUsedDiesel || 0),
      };

      // Save current daily data
      localStorage.setItem(`daily-fuel-${dayKey}`, JSON.stringify(dailyData));
      localStorage.setItem(savedKey, JSON.stringify(dailyData));
      setDailyFuelData(dailyData);

      // Accumulate difference to monthly totals
      const accumulatedDieselCost = (fuelData.dieselCost || 0) + (difference.dieselCost || 0);
      const accumulatedPetrolCost = (fuelData.petrolCost || 0) + (difference.petrolCost || 0);
      const accumulatedTotalCost = accumulatedDieselCost + accumulatedPetrolCost;
      
      const accumulatedData: FuelData = {
        ...fuelData,
        fuelCf: (fuelData.fuelCf || 0) + (difference.fuelCf || 0),
        dieselAmount: (fuelData.dieselAmount || 0) + (difference.dieselAmount || 0),
        dieselCost: accumulatedDieselCost,
        petrolAmount: (fuelData.petrolAmount || 0) + (difference.petrolAmount || 0),
        petrolCost: accumulatedPetrolCost,
        totalLitersUsed: (fuelData.totalLitersUsed || 0) + (difference.totalLitersUsed || 0),
        totalCost: accumulatedTotalCost, // Calculate from accumulated dieselCost + petrolCost
        totalExpense: (fuelData.totalExpense || 0) + (difference.totalExpense || 0),
        fuelBalance: (fuelData.fuelBalance || 0) + (difference.fuelBalance || 0),
        amountEarned: (fuelData.amountEarned || 0) + (difference.amountEarned || 0),
        otherCosts: (fuelData.otherCosts || 0) + (difference.otherCosts || 0),
        totalLitersUsedDiesel: (fuelData.totalLitersUsedDiesel || 0) + (difference.totalLitersUsedDiesel || 0),
        fuelConsumptionRate: formData.fuelConsumptionRate ?? fuelData.fuelConsumptionRate,
        monthlySalary: formData.monthlySalary ?? fuelData.monthlySalary,
        netProfit: null, // Will be calculated in dashboard
      };

      // Calculate net profit
      const dieselUnitCost =
        accumulatedData.dieselAmount && accumulatedData.dieselAmount > 0
          ? (accumulatedData.dieselCost || 0) / accumulatedData.dieselAmount
          : 0;
      const totalLitersUsed = accumulatedData.totalLitersUsedDiesel || 0;
      const usageCost = dieselUnitCost * totalLitersUsed;
      const monthlySalary = accumulatedData.monthlySalary || 0;
      accumulatedData.netProfit =
        (accumulatedData.amountEarned || 0) -
        (usageCost +
          (accumulatedData.dieselCost || 0) +
          (accumulatedData.petrolCost || 0) +
          (accumulatedData.totalExpense || 0) +
          (accumulatedData.otherCosts || 0) +
          monthlySalary);

      onSave(accumulatedData);
      toast.success('Daily fuel & expense data saved and added to monthly totals');
    } else {
      // No day selected, save monthly data directly
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
    }
  };

  const calculatedTotalLiters = (formData.dieselAmount || 0) + (formData.petrolAmount || 0);
  const calculatedTotalCost = (formData.dieselCost || 0) + (formData.petrolCost || 0);
  const calculatedLitersUsedDiesel =
    formData.fuelConsumptionRate && formData.fuelConsumptionRate > 0
      ? Number((totalDistance / formData.fuelConsumptionRate).toFixed(2))
      : formData.totalLitersUsedDiesel || 0;

  const fields: { key: keyof FuelData; label: string; prefix?: string; suffix?: string; placeholder?: string; readOnly?: boolean }[] = [
    { key: 'fuelCf', label: 'Fuel CF' },
    { key: 'dieselAmount', label: 'Diesel Amount', suffix: 'L' },
    { key: 'dieselCost', label: 'Diesel Cost', prefix: 'KES' },
    { key: 'petrolAmount', label: 'Petrol Amount', suffix: 'L' },
    { key: 'petrolCost', label: 'Petrol Cost', prefix: 'KES' },
    { key: 'fuelConsumptionRate', label: 'Fuel Consumption (km/L)', suffix: 'km/L', placeholder: 'e.g. 6' },
    { key: 'totalLitersUsedDiesel', label: 'Total Liters Used - Diesel', suffix: 'L' },
    { key: 'totalCost', label: 'Total Cost', prefix: 'KES', readOnly: true },
    { key: 'totalExpense', label: 'Total Expense', prefix: 'KES' },
    { key: 'otherCosts', label: 'Other Costs', prefix: 'KES' },
    { key: 'fuelBalance', label: 'Fuel Balance', prefix: 'KES' },
    { key: 'amountEarned', label: 'Amount Earned', prefix: 'KES' },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            Fuel & Expenses
          </div>
          {selectedDay && (
            <div className="text-sm text-muted-foreground">
              Daily Entry: {format(selectedDay, 'MMM dd, yyyy')}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {fields.map(({ key, label, prefix, suffix, placeholder, readOnly }) => (
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
                  readOnly={readOnly}
                  disabled={readOnly}
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
