'use client';

import { useEffect, useRef, useState } from 'react';
import { PreviewFrameProps } from '@/types';
import { Loader } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export function PreviewFrame({ webContainer, files, isLoading }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!webContainer || !files.length || isLoading) return;

    const setupPreview = async () => {
      try {
        // Wait for server to be ready
        webContainer.on('server-ready', (port: number, url: string) => {
          if (iframeRef.current) {
            iframeRef.current.src = url;
            setError(null);
          }
        });

        // Listen for preview errors
        webContainer.on('preview-message', (message) => {
          console.error('Preview error:', message);
          setError('An error occurred in the preview');
          toast({
            title: "Preview Error",
            description: "An error occurred while running the preview",
            variant: "destructive"
          });
        });
      } catch (err) {
        console.error('Failed to setup preview:', err);
        setError('Failed to setup preview');
        toast({
          title: "Preview Error",
          description: "Failed to setup preview",
          variant: "destructive"
        });
      }
    };

    setupPreview();
  }, [webContainer, files, isLoading]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center">
          <Loader className="w-8 h-8 mb-4 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-400">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center text-red-400">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg overflow-hidden">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="Preview"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
    </div>
  );
}