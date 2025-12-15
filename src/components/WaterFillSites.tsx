import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Droplet, Plus, X } from 'lucide-react';
import { WaterFillSite } from '@/types/mileage';
import { toast } from 'sonner';

interface WaterFillSitesProps {
  sites: WaterFillSite[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}

export const WaterFillSites = ({ sites, onAdd, onDelete }: WaterFillSitesProps) => {
  const [newSite, setNewSite] = useState('');

  const handleAdd = () => {
    if (!newSite.trim()) {
      toast.error('Please enter a site name');
      return;
    }
    if (sites.some(s => s.name.toLowerCase() === newSite.toLowerCase())) {
      toast.error('This site already exists');
      return;
    }
    onAdd(newSite.trim());
    setNewSite('');
    toast.success('Water fill site added');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Droplet className="w-5 h-5 text-cyan-400" />
          Water Fill Sites
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add water fill site name..."
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleAdd} size="icon" variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {sites.map((site) => (
            <Badge
              key={site.id}
              variant="secondary"
              className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-3 py-1.5 text-sm flex items-center gap-2"
            >
              <Droplet className="w-3 h-3" />
              {site.name}
              <button
                onClick={() => onDelete(site.id)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {sites.length === 0 && (
            <p className="text-sm text-muted-foreground">No water fill sites added yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
