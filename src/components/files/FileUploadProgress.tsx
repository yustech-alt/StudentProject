import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, FileText, X } from "lucide-react";
import type { UploadProgress } from "@/hooks/useFileUpload";

interface FileUploadProgressProps {
  uploads: UploadProgress[];
  onRemove?: (fileName: string) => void;
}

export function FileUploadProgress({ uploads, onRemove }: FileUploadProgressProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
      <p className="text-sm font-medium text-foreground">Upload Progress</p>
      {uploads.map((upload) => (
        <div key={upload.fileName} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate">{upload.fileName}</span>
            </div>
            <div className="flex items-center gap-2">
              {upload.status === 'pending' && (
                <span className="text-xs text-muted-foreground">Waiting...</span>
              )}
              {upload.status === 'uploading' && (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              )}
              {upload.status === 'complete' && (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              {upload.status === 'error' && (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              {onRemove && upload.status !== 'uploading' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onRemove(upload.fileName)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <Progress 
            value={upload.progress} 
            className={`h-2 ${
              upload.status === 'error' ? 'bg-destructive/20' : 
              upload.status === 'complete' ? 'bg-success/20' : ''
            }`} 
          />
          {upload.status === 'error' && upload.error && (
            <p className="text-xs text-destructive">{upload.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}