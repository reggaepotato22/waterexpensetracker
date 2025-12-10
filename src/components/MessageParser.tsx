import { useState, useCallback } from "react";
import { MessageSquare, Sparkles, Loader2, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface ParsedMessage {
  timestamp: Date;
  location: string;
  mileage: number | null;
  rawText: string;
}

interface MessageParserProps {
  onMessagesParsed: (messages: ParsedMessage[]) => void;
}

const MessageParser = ({ onMessagesParsed }: MessageParserProps) => {
  const [messages, setMessages] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const parseWhatsAppMessages = useCallback((text: string, start: Date | null, end: Date | null): ParsedMessage[] => {
    const lines = text.split('\n');
    const parsed: ParsedMessage[] = [];
    
    // Common WhatsApp message patterns
    // Format: [DD/MM/YYYY, HH:MM:SS] Sender: Message
    // Or: DD/MM/YYYY, HH:MM - Sender: Message
    const datePatterns = [
      /\[?(\d{1,2}\/\d{1,2}\/\d{4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*[-–]?\s*/,
      /(\d{1,2}\/\d{1,2}\/\d{4}),\s+(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*[-–]\s*/i,
    ];
    
    // Location keywords to look for
    const locationKeywords = [
      'arrived at', 'arrived', 'at customer', 'customer', 'location:', 
      'destination:', 'reached', 'going to', 'heading to', 'from', 'to'
    ];
    
    // Mileage patterns
    const mileagePatterns = [
      /(\d{4,6})\s*(?:km|KM|Km)?/,
      /mileage[:\s]*(\d{4,6})/i,
      /odometer[:\s]*(\d{4,6})/i,
      /reading[:\s]*(\d{4,6})/i,
    ];

    for (const line of lines) {
      if (!line.trim()) continue;

      let timestamp: Date | null = null;
      let cleanedLine = line;

      // Try to extract date/time
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          const [fullMatch, datePart, timePart] = match;
          const [day, month, year] = datePart.split('/').map(Number);
          const timeParts = timePart.replace(/\s*[AP]M/i, '').split(':').map(Number);
          
          timestamp = new Date(year, month - 1, day, timeParts[0] || 0, timeParts[1] || 0);
          cleanedLine = line.replace(fullMatch, '').trim();
          break;
        }
      }

      // Filter by date range
      if (timestamp && start && timestamp < start) continue;
      if (timestamp && end && timestamp > end) continue;

      // Extract location
      let location = '';
      const lowerLine = cleanedLine.toLowerCase();
      
      for (const keyword of locationKeywords) {
        const idx = lowerLine.indexOf(keyword);
        if (idx !== -1) {
          // Get text after the keyword
          const afterKeyword = cleanedLine.substring(idx + keyword.length).trim();
          // Extract first few words as location (up to comma, period, or end)
          const locationMatch = afterKeyword.match(/^[:\s]*([A-Za-z0-9\s\-\.]+?)(?:[,\.\n]|$)/);
          if (locationMatch) {
            location = locationMatch[1].trim();
            break;
          }
        }
      }

      // If no keyword found, try to find capitalized words as location
      if (!location) {
        const capsMatch = cleanedLine.match(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\b/);
        if (capsMatch && capsMatch[1].length > 2) {
          location = capsMatch[1];
        }
      }

      // Extract mileage
      let mileage: number | null = null;
      for (const pattern of mileagePatterns) {
        const match = cleanedLine.match(pattern);
        if (match) {
          const num = parseInt(match[1]);
          // Only accept reasonable mileage values (5-6 digits typically)
          if (num >= 10000 && num <= 999999) {
            mileage = num;
            break;
          }
        }
      }

      if (location || mileage) {
        parsed.push({
          timestamp: timestamp || new Date(),
          location: location || 'Unknown',
          mileage,
          rawText: cleanedLine.substring(0, 100),
        });
      }
    }

    return parsed.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, []);

  const handleParse = async () => {
    if (!messages.trim()) {
      toast.error("Please paste WhatsApp messages first");
      return;
    }

    setIsProcessing(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;

    const parsed = parseWhatsAppMessages(messages, start, end);

    if (parsed.length === 0) {
      toast.warning("No entries found. Try different date range or check message format.");
    } else {
      toast.success(`Found ${parsed.length} entries!`);
      onMessagesParsed(parsed);
    }

    setIsProcessing(false);
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Scan WhatsApp Messages</h2>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Start Date
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            End Date
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Message Input */}
      <div className="space-y-2 mb-4">
        <Label htmlFor="messages" className="text-xs">
          Paste WhatsApp Messages (Export chat or copy messages)
        </Label>
        <Textarea
          id="messages"
          placeholder={`Example format:
[12/12/2024, 09:49] Water - KDD 0497Z: Arrived at customer ASL 72742
[12/12/2024, 10:55] Water - KDD 0497Z: Arrived at Olekasasi 72758

Or simply paste the chat export...`}
          value={messages}
          onChange={(e) => setMessages(e.target.value)}
          className="min-h-[160px] font-mono text-sm resize-none"
        />
      </div>

      <Button 
        onClick={handleParse} 
        disabled={isProcessing}
        className="w-full"
        variant="glow"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Scanning Messages...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Scan & Extract Data
          </>
        )}
      </Button>

      <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> Export your WhatsApp chat (Menu → More → Export chat → Without media) and paste it here. The parser will extract locations and mileage readings automatically.
        </p>
      </div>
    </div>
  );
};

export default MessageParser;
