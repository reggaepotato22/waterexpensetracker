import { MileageEntry } from "@/types/mileage";
import { Trash2, Edit2, Check, X, Trash } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";

interface MileageTableProps {
  entries: MileageEntry[];
  onUpdateEntry: (id: string, updates: Partial<MileageEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

const MileageTable = ({ entries, onUpdateEntry, onDeleteEntry, onClearAll }: MileageTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<MileageEntry>>({});

  const handleEdit = (entry: MileageEntry) => {
    setEditingId(entry.id);
    setEditValues({
      start: entry.start,
      end: entry.end,
      mileageStart: entry.mileageStart,
      mileageEnd: entry.mileageEnd,
    });
  };

  const handleSave = (id: string) => {
    onUpdateEntry(id, editValues);
    setEditingId(null);
    setEditValues({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const getStatusBadge = (status: MileageEntry['status']) => {
    const styles = {
      pending: 'bg-warning/10 text-warning',
      processed: 'bg-success/10 text-success',
      manual: 'bg-primary/10 text-primary',
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (entries.length === 0) {
    return (
      <div className="glass-card p-8 text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <MessageSquareIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No entries yet.</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Paste WhatsApp messages to extract mileage data.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Extracted Entries</h2>
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-destructive hover:text-destructive">
          <Trash className="w-4 h-4 mr-1" />
          Clear All
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">#</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Start</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">End</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Mileage Start</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Mileage End</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Distance</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                <td className="p-3 font-mono text-sm text-foreground">{entry.jobNumber}</td>
                <td className="p-3 text-xs text-muted-foreground">{formatTime(entry.timestamp)}</td>
                
                {editingId === entry.id ? (
                  <>
                    <td className="p-3">
                      <Input
                        value={editValues.start || ''}
                        onChange={(e) => setEditValues({ ...editValues, start: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={editValues.end || ''}
                        onChange={(e) => setEditValues({ ...editValues, end: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={editValues.mileageStart || ''}
                        onChange={(e) => setEditValues({ ...editValues, mileageStart: Number(e.target.value) })}
                        className="h-8 text-sm font-mono"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={editValues.mileageEnd || ''}
                        onChange={(e) => setEditValues({ ...editValues, mileageEnd: Number(e.target.value) })}
                        className="h-8 text-sm font-mono"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 text-sm text-foreground">{entry.start || '—'}</td>
                    <td className="p-3 text-sm text-foreground">{entry.end || '—'}</td>
                    <td className="p-3 text-sm font-mono text-foreground">{entry.mileageStart?.toLocaleString() || '—'}</td>
                    <td className="p-3 text-sm font-mono text-foreground">{entry.mileageEnd?.toLocaleString() || '—'}</td>
                  </>
                )}
                
                <td className="p-3 text-sm font-mono font-semibold text-primary">
                  {entry.distance ? `${entry.distance} km` : '—'}
                </td>
                <td className="p-3">{getStatusBadge(entry.status)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {editingId === entry.id ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSave(entry.id)}>
                          <Check className="w-4 h-4 text-success" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(entry)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteEntry(entry.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MessageSquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </svg>
);

export default MileageTable;
