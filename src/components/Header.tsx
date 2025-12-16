import { FileSpreadsheet, Settings } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  onCreateNewDay?: () => void;
  onOpenSettings?: () => void;
}

const Header = ({ onCreateNewDay, onOpenSettings }: HeaderProps) => {
  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <img
              src="/favicon.ico"
              alt="WaterTracker logo"
              className="w-6 h-6 rounded"
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">WaterTracker</h1>
            <p className="text-xs text-muted-foreground">Meter Reading Automation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCreateNewDay}
            aria-label="Create new day sheet"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
