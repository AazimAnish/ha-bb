import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Loader } from 'lucide-react';
import { FileItem } from '@/types';
import { WebContainer, WebContainerProcess, FileSystemTree } from '@webcontainer/api';

interface PreviewFrameProps {
  webContainer: WebContainer | null;
  files: FileItem[];
  isLoading: boolean;
  onOutput?: (output: string) => void;
}

export function PreviewFrame({ webContainer, files, isLoading, onOutput }: PreviewFrameProps) {
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const devProcessRef = useRef<WebContainerProcess | null>(null);
  const isMounted = useRef<boolean>(true);

  const createMountStructure = useCallback((files: FileItem[]): FileSystemTree => {
    const mountStructure: FileSystemTree = {};

    const processFile = (file: FileItem): FileSystemTree[string] => {
      if (file.type === 'folder') {
        return {
          directory: file.children?.reduce((acc, child) => ({
            ...acc,
            [child.name]: processFile(child)
          }), {}) || {}
        };
      } else {
        return {
          file: {
            contents: file.content || ''
          }
        };
      }
    };

    files.forEach(file => {
      mountStructure[file.name] = processFile(file);
    });

    return mountStructure;
  }, []);

  const startDevServer = useCallback(async () => {
    if (!webContainer) return;

    try {
      setError('');
      const mountStructure = createMountStructure(files);
      await webContainer.mount(mountStructure);

      onOutput?.('\n📦 Installing dependencies...\n');
      const installProcess = await webContainer.spawn('npm', ['install']);
      
      if (installProcess) {
        const installReader = installProcess.output.getReader();
        try {
          while (true) {
            const { done, value } = await installReader.read();
            if (done || !isMounted.current) break;
            onOutput?.(value);
          }
        } finally {
          installReader.releaseLock();
        }

        const installExit = await installProcess.exit;
        if (installExit !== 0) {
          throw new Error('Installation failed');
        }
      }

      onOutput?.('\n🚀 Starting development server...\n');
      const devProcess = await webContainer.spawn('npm', ['run', 'dev']);
      devProcessRef.current = devProcess;

      if (devProcess) {
        const devReader = devProcess.output.getReader();
        try {
          while (true) {
            const { done, value } = await devReader.read();
            if (done || !isMounted.current) break;
            onOutput?.(value);
          }
        } finally {
          devReader.releaseLock();
        }
      }

      const unsubscribe = webContainer.on('server-ready', (port, serverUrl) => {
        if (isMounted.current) {
          setUrl(serverUrl);
          onOutput?.(`\n🌐 Server ready on: ${serverUrl}\n`);
        }
      });

      return () => {
        unsubscribe();
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start server';
      console.error('Server error:', err);
      setError(errorMessage);
      onOutput?.(`\n❌ Error: ${errorMessage}\n`);
    }
  }, [webContainer, files, onOutput, createMountStructure]);

  useEffect(() => {
    isMounted.current = true;

    if (webContainer && files.length > 0) {
      void startDevServer();
    }

    return () => {
      isMounted.current = false;
      if (devProcessRef.current) {
        try {
          devProcessRef.current.kill();
        } catch (error) {
          console.error('Error killing process:', error);
        }
      }
    };
  }, [webContainer, files, startDevServer]);

  if (isLoading || !url) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center">
          <Loader className="w-8 h-8 mb-4 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-400">Starting development server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg overflow-hidden">
      <iframe 
        src={url}
        className="w-full h-full border-0"
        title="Preview"
        allow="cross-origin-isolated"
      />
    </div>
  );
}