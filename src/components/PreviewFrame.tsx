import React, { useEffect, useState, useRef } from 'react';
import { WebContainer } from '@webcontainer/api';
import { FileItem } from '@/types';
import { Loader } from 'lucide-react';

interface PreviewFrameProps {
  webContainer: WebContainer | null;
  files: FileItem[];
  isLoading: boolean;
  onOutput?: (output: string) => void;
}

async function ensureDirectoryExists(webContainer: WebContainer, path: string) {
  try {
    await webContainer.fs.mkdir(path, { recursive: true });
    // Verify directory was created
    try {
      await webContainer.fs.readdir(path);
      console.log(`✅ Directory created: ${path}`);
    } catch (error) {
      console.error(`Failed to verify directory ${path}:`, error);
      throw new Error(`Failed to verify directory: ${path}`);
    }
  } catch (error) {
    console.error(`Failed to create directory ${path}:`, error);
    throw error;
  }
}

export function PreviewFrame({ webContainer, files, isLoading, onOutput }: PreviewFrameProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const isMountedRef = useRef(true);

  const startDevServer = async () => {
    try {
      setError('');
      setRetrying(true);
      if (!webContainer) return;
      
      // Create required directories with proper paths
      const directories = ['/tmp', '/tmp/src'];
      for (const dir of directories) {
        await ensureDirectoryExists(webContainer, dir);
      }

      // Write user-generated files with proper path handling
      for (const file of files) {
        try {
          if (file.path.includes('package.json')) continue;

          // Create parent directory if needed
          const adjustedPath = `/tmp/${file.path.replace(/^\//, '')}`;
          const parentDir = adjustedPath.substring(0, adjustedPath.lastIndexOf('/'));
          if (parentDir) {
            await ensureDirectoryExists(webContainer, parentDir);
          }

          // Only write if it's a file, not a directory
          if (file.type === 'file') {
            await webContainer.fs.writeFile(adjustedPath, file.content || '');
            console.log(`✅ User file written: ${adjustedPath}`);
          }
        } catch (error) {
          console.error(`Failed to write user file ${file.path}:`, error);
          throw error;
        }
      }

      // Write package.json with base dependencies
      const packageJson = {
        name: "user-app",
        private: true,
        version: "0.0.0",
        type: "module",
        scripts: {
          "dev": "vite",
          "build": "vite build",
          "preview": "vite preview"
        },
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0"
        },
        devDependencies: {
          "@vitejs/plugin-react": "^4.2.1",
          "vite": "^5.0.8"
        }
      };

      // Add any additional dependencies from files
      if (files.some(f => f.path.includes('package.json'))) {
        const userPackageJson = files.find(f => f.path.includes('package.json'));
        if (userPackageJson) {
          try {
            const userDeps = JSON.parse(userPackageJson.content || '{}');
            packageJson.dependencies = {
              ...packageJson.dependencies,
              ...(userDeps.dependencies || {})
            };
            packageJson.devDependencies = {
              ...packageJson.devDependencies,
              ...(userDeps.devDependencies || {})
            };
          } catch (error) {
            console.error('Failed to parse user package.json:', error);
          }
        }
      }

      // Base files needed for React + Vite setup
      const baseFiles = [
        {
          path: 'tmp/package.json',
          content: JSON.stringify(packageJson, null, 2)
        },
        {
          path: 'tmp/vite.config.js',
          content: `
            import { defineConfig } from 'vite'
            import react from '@vitejs/plugin-react'
            export default defineConfig({
              plugins: [react()]
            })
          `.trim()
        },
        {
          path: 'tmp/index.html',
          content: `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Generated App</title>
              </head>
              <body>
                <div id="root"></div>
                <script type="module" src="/src/main.jsx"></script>
              </body>
            </html>
          `.trim()
        },
        {
          path: 'tmp/src/App.jsx',
          content: `
            import React from 'react';
            
            export default function App() {
              return (
                <div className="max-w-md mx-auto mt-10 p-6">
                  <h1 className="text-2xl font-bold mb-4">React App</h1>
                  <p className="text-gray-600">Edit src/App.jsx to get started</p>
                </div>
              );
            }
          `.trim()
        },
        {
          path: 'tmp/src/main.jsx',
          content: `
            import React from 'react'
            import ReactDOM from 'react-dom/client'
            import App from './App.jsx'

            ReactDOM.createRoot(document.getElementById('root')).render(
              <React.StrictMode>
                <App />
              </React.StrictMode>
            )
          `.trim()
        }
      ];

      // Write base files first
      for (const file of baseFiles) {
        try {
          await webContainer.fs.writeFile(file.path, file.content);
          console.log(`✅ Base file written: ${file.path}`);
        } catch (error) {
          console.error(`Failed to write base file ${file.path}:`, error);
          throw error;
        }
      }

      // Install dependencies with improved error handling
      onOutput?.('\r\n📦 Installing dependencies...\r\n');
      const installProcess = await webContainer?.spawn('npm', ['install', '--no-audit', '--no-fund'], {
        cwd: 'tmp',
        env: {
          NODE_ENV: 'development',
          PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
          npm_config_cache: '/tmp/.npm-cache'
        }
      });
      
      if (installProcess) {
        let installOutput = '';
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              installOutput += data;
              onOutput?.(data);
            }
          })
        );

        const installExit = await installProcess.exit;
        if (installExit !== 0) {
          console.error('Installation failed:', installOutput);
          throw new Error(`Installation failed with exit code ${installExit}`);
        }
      }

      // Start dev server with improved error handling
      onOutput?.('\r\n🚀 Starting development server...\r\n');
      const devProcess = await webContainer?.spawn('npm', ['run', 'dev', '--', '--host'], {
        cwd: 'tmp',
        env: {
          NODE_ENV: 'development',
          PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
          npm_config_cache: '/tmp/.npm-cache'
        }
      });
      
      if (devProcess) {
        let serverOutput = '';
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              serverOutput += data;
              onOutput?.(data);
              console.log('Server output:', data);
              
              // Check for Vite server URL in output
              if (serverOutput.includes('Local:') && !url) {
                const match = serverOutput.match(/Local:\s+(http:\/\/localhost:\d+)/);
                if (match && match[1]) {
                  setUrl(match[1]);
                }
              }
            }
          })
        );

        // Handle server process exit
        devProcess.exit.then((code) => {
          if (code !== 0) {
            console.error('Dev server exited with code:', code);
            setError(`Dev server exited with code ${code}`);
          }
        });
      }

      // Listen for server-ready event
      webContainer?.on('server-ready', (port, serverUrl) => {
        if (isMountedRef.current) {
          console.log('Server ready on:', serverUrl);
          onOutput?.(`\r\nServer ready on: ${serverUrl}\n`);
          setUrl(serverUrl);
        }
      });

    } catch (err) {
      console.error('Server error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start server');
      onOutput?.(`\r\n❌ Error: ${err instanceof Error ? err.message : 'Failed to start server'}\n`);
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (!webContainer) return;

    isMountedRef.current = true;
    startDevServer();

    return () => {
      isMountedRef.current = false;
    };
  }, [webContainer, onOutput]);

  if (isLoading || !url) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center">
          <Loader className="w-8 h-8 mb-4 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-400">Starting Vite development server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center">
          <p className="text-lg mb-4 text-red-500">{error}</p>
          <button 
            onClick={startDevServer}
            disabled={retrying}
            className="px-4 py-2 bg-[#F14A00] text-white rounded-md hover:bg-[#D93F00] disabled:opacity-50"
          >
            {retrying ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              'Retry'
            )}
          </button>
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
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      />
    </div>
  );
}