import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { logError } from '@/lib/logger';
export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  // Storage path within the private 'project-files' bucket. Use
  // AppContext's getFileUrl(path) to turn this into a short-lived signed
  // URL whenever you actually need to display or download the file.
  path?: string;
  fileSizeBytes?: number;
  error?: string;
}

interface UseFileUploadOptions {
  bucket?: string;
  folder?: string;
  onComplete?: (file: UploadProgress) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { bucket = 'project-files', folder = '', onComplete } = options;
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File, projectId?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to upload files.",
        variant: "destructive"
      });
      return {
        fileName: file.name,
        progress: 0,
        status: 'error' as const,
        error: 'Not authenticated'
      };
    }

    const fileName = file.name;
    const fileId = `${Date.now()}-${fileName}`;
    
    // Include user ID in path for ownership-based RLS policies
    // Path structure: {user_id}/{project_id}/{file_id}
    const filePath = folder 
      ? `${user.id}/${folder}/${projectId || 'general'}/${fileId}`
      : `${user.id}/${projectId || 'general'}/${fileId}`;

    // Add to uploads list
    setUploads(prev => [...prev, {
      fileName,
      progress: 0,
      status: 'pending'
    }]);

    setIsUploading(true);

    try {
      // Update status to uploading
      setUploads(prev => prev.map(u => 
        u.fileName === fileName ? { ...u, status: 'uploading' as const, progress: 10 } : u
      ));

      // Simulate progress updates (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploads(prev => prev.map(u => 
          u.fileName === fileName && u.status === 'uploading' && u.progress < 90
            ? { ...u, progress: Math.min(u.progress + 15, 90) }
            : u
        ));
      }, 200);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      // The bucket is private, so there is no public URL to fetch here.
      // Callers get a short-lived signed URL on demand via getFileUrl(path).
      const uploadResult: UploadProgress = {
        fileName,
        progress: 100,
        status: 'complete',
        path: filePath,
        fileSizeBytes: file.size,
      };

      setUploads(prev => prev.map(u => 
        u.fileName === fileName ? uploadResult : u
      ));

      toast({
        title: "File Uploaded",
        description: `${fileName} has been uploaded successfully.`,
      });

      onComplete?.(uploadResult);
      return uploadResult;

    } catch (error: any) {
      logError('useFileUpload:uploadFile', error);
      
      const errorResult: UploadProgress = {
        fileName,
        progress: 0,
        status: 'error',
        error: error.message || 'Upload failed'
      };

      setUploads(prev => prev.map(u => 
        u.fileName === fileName ? errorResult : u
      ));

      toast({
        title: "Upload Failed",
        description: error.message || 'Failed to upload file',
        variant: "destructive"
      });

      return errorResult;
    } finally {
      setIsUploading(false);
    }
  }, [bucket, folder, onComplete, toast, user]);

  const uploadMultipleFiles = useCallback(async (files: FileList | File[], projectId?: string) => {
    const results: UploadProgress[] = [];
    
    for (const file of Array.from(files)) {
      const result = await uploadFile(file, projectId);
      results.push(result);
    }
    
    return results;
  }, [uploadFile]);

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const removeUpload = useCallback((fileName: string) => {
    setUploads(prev => prev.filter(u => u.fileName !== fileName));
  }, []);

  return {
    uploads,
    isUploading,
    uploadFile,
    uploadMultipleFiles,
    clearUploads,
    removeUpload
  };
}
