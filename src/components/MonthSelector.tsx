import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { format, addMonths, subMonths } from "date-fns";

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

const MonthSelector = ({ selectedMonth, onMonthChange }: MonthSelectorProps) => {
  const handlePrevMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(selectedMonth, 1));
  };

  const isCurrentMonth = format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  return (
    <div className="glass-card p-3 flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">
          {format(selectedMonth, 'MMMM yyyy')}
        </span>
        {isCurrentMonth && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
            Current
          </span>
        )}
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleNextMonth}
        disabled={isCurrentMonth}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default MonthSelector;
