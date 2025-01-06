import React, { useEffect, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { FileItem } from '@/types';
import { Loader } from 'lucide-react';

interface PreviewFrameProps {
  webContainer: WebContainer | null;
  files: FileItem[];
  isLoading: boolean;
}

export function PreviewFrame({ webContainer, files, isLoading }: PreviewFrameProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!webContainer) return;

    let isMounted = true;
    let serverCheckInterval: NodeJS.Timeout;

    const checkServer = async () => {
      try {
        // Check if server is running on port 5173 (Vite's default port)
        const response = await fetch('http://localhost:5173');
        if (response.ok && isMounted) {
          setUrl('http://localhost:5173');
          setLoading(false);
          setError('');
          if (serverCheckInterval) clearInterval(serverCheckInterval);
        }
      } catch (err) {
        // Server not ready yet, continue checking
        if (isMounted) {
          setLoading(true);
        }
      }
    };

    // Handle server ready event
    const handleServerReady = (port: number, url: string) => {
      if (isMounted) {
        console.log('Server ready on:', url);
        setUrl(url);
        setError('');
        setLoading(false);
        if (serverCheckInterval) clearInterval(serverCheckInterval);
      }
    };

    // Handle server error
    const handleError = (error: { message: string }) => {
      if (isMounted) {
        console.error('Server error:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    // Start checking server and set up listeners
    serverCheckInterval = setInterval(checkServer, 1000);
    webContainer.on('server-ready', handleServerReady);
    webContainer.on('error', handleError);

    // Cleanup function
    return () => {
      isMounted = false;
      if (serverCheckInterval) clearInterval(serverCheckInterval);
      // Don't teardown the container here, as it's managed by the parent
    };
  }, [webContainer]);

  if (isLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center">
          <Loader className="w-8 h-8 mb-4 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-400">
            {isLoading ? 'Initializing...' : 'Starting development server...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center text-red-500">
          <p className="text-lg mb-2">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <p className="text-sm text-neutral-400">Waiting for development server...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg overflow-hidden">
      <iframe 
        src={url}
        className="w-full h-full border-0"
        title="Preview"
      />
    </div>
  );
}