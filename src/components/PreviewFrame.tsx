import { useEffect, useRef } from 'react';
import { PreviewFrameProps } from '@/types';
import { WebContainer } from '@webcontainer/api';

export function PreviewFrame({ webContainer, files, isLoading }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!webContainer || !files.length || isLoading) return;

    const setupPreview = async () => {
      try {
        // Wait for server to be ready
        webContainer.on('server-ready', (port: number, url: string) => {
          if (iframeRef.current) {
            iframeRef.current.src = url;
          }
        });

        // Listen for preview errors
        webContainer.on('preview-message', (message) => {
          console.error('Preview error:', message);
        });
      } catch (err) {
        console.error('Failed to setup preview:', err);
      }
    };

    setupPreview();
  }, [webContainer, files, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="Preview"
      sandbox="allow-same-origin allow-scripts allow-forms"
    />
  );
}