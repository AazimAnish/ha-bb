import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';
import { FileItem } from '@/types';

interface PreviewFrameProps {
  webContainer?: WebContainer;
  files: FileItem[];
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    let devProcess: any = null;

    async function main() {
      if (!webContainer) return;

      try {
        const installProcess = await webContainer.spawn('npm', ['install']);

        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log(data);
          }
        }));

        await installProcess.exit;

        devProcess = await webContainer.spawn('npm', ['run', 'dev']);
        
        webContainer.on('server-ready', (port, url) => {
          if (mounted) {
            setUrl(url);
            setError("");
          }
        });
      } catch (err) {
        console.error('Preview error:', err);
        if (mounted) {
          setError("Failed to start preview server");
        }
      }
    }

    main();

    return () => {
      mounted = false;
      if (devProcess) {
        try {
          devProcess.kill();
        } catch (error) {
          console.error('Error killing dev process:', error);
        }
      }
    };
  }, [webContainer]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url && <div className="text-center">
        <p className="mb-2">Loading preview...</p>
      </div>}
      {url && <iframe 
        width={"100%"} 
        height={"100%"} 
        src={url}
        title="Preview"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />}
    </div>
  );
}
