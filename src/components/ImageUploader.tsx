import { useState, useCallback } from "react";
import { Upload, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageProcessed: (mileage: number, imageUrl: string) => void;
}

const ImageUploader = ({ onImageProcessed }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Simulate OCR processing (in real app, this would call an AI service)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulated extracted number (random 5-digit mileage)
    const extractedMileage = Math.floor(70000 + Math.random() * 10000);
    
    toast.success(`Extracted mileage: ${extractedMileage.toLocaleString()} km`);
    onImageProcessed(extractedMileage, previewUrl || '');
    
    setIsProcessing(false);
    setPreviewUrl(null);
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Upload Meter Image</h2>
      </div>
      
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${isProcessing ? 'pointer-events-none' : 'cursor-pointer'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Processing" 
                className="w-32 h-32 object-cover rounded-lg opacity-50"
              />
            )}
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Extracting mileage...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              {isDragging ? (
                <ImageIcon className="w-8 h-8 text-primary" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-foreground font-medium">
                {isDragging ? "Drop image here" : "Drag & drop meter image"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse files
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-subtle" />
        AI-powered number extraction ready
      </div>
    </div>
  );
};

export default ImageUploader;
