import { useEffect, useRef, useState } from 'react';
import { TerminalProps } from '@/types';
import { WebContainerProcess } from '@webcontainer/api';

export function Terminal({ webContainer, isLoading }: TerminalProps) {
  const [output, setOutput] = useState<string>('');
  const processRef = useRef<WebContainerProcess | null>(null);

  useEffect(() => {
    if (!webContainer || isLoading) return;

    const startShell = async () => {
      try {
        // Start a shell process
        const shellProcess = await webContainer.spawn('bash');
        processRef.current = shellProcess;

        // Handle shell output
        const reader = shellProcess.output.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setOutput(prev => prev + value);
        }

        // Handle shell exit
        const exitCode = await shellProcess.exit;
        if (exitCode !== 0) {
          setOutput(prev => prev + `\nProcess exited with code ${exitCode}\n`);
        }
      } catch (err) {
        console.error('Failed to start shell:', err);
        setOutput(prev => prev + `\nError: ${err instanceof Error ? err.message : String(err)}\n`);
      }
    };

    startShell();

    return () => {
      if (processRef.current) {
        processRef.current.kill();
      }
    };
  }, [webContainer, isLoading]);

  return (
    <div className="bg-black text-white font-mono p-4 h-48 overflow-auto">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : (
        <pre className="whitespace-pre-wrap">{output}</pre>
      )}
    </div>
  );
}