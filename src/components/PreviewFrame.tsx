import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!webContainer) return;

    let isMounted = true;

    async function startDevServer() {
      try {
        if (!webContainer) return;
        
        // Create required directories in the user's home directory
        const directories = ['tmp', 'tmp/src'];
        for (const dir of directories) {
          await ensureDirectoryExists(webContainer, dir);
        }

        // Write files with error handling
        const files = [
          {
            path: 'tmp/package.json',
            content: JSON.stringify({
              name: "react-todo",
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
            }, null, 2)
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
                  <title>React Todo</title>
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
              import React, { useState } from 'react';
              
              export default function App() {
                const [todos, setTodos] = useState([]);
                const [input, setInput] = useState('');

                const addTodo = (e) => {
                  e.preventDefault();
                  if (!input.trim()) return;
                  setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
                  setInput('');
                };

                return (
                  <div className="max-w-md mx-auto mt-10 p-6">
                    <h1 className="text-2xl font-bold mb-4">Todo App</h1>
                    <form onSubmit={addTodo} className="mb-4">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Add a todo"
                        className="border p-2 mr-2 rounded"
                      />
                      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                        Add
                      </button>
                    </form>
                    <ul>
                      {todos.map(todo => (
                        <li key={todo.id} className="bg-gray-100 p-2 mb-2 rounded">
                          {todo.text}
                        </li>
                      ))}
                    </ul>
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
              import App from './App'

              ReactDOM.createRoot(document.getElementById('root')).render(
                <React.StrictMode>
                  <App />
                </React.StrictMode>
              )
            `.trim()
          }
        ];

        // Write all files with error handling
        for (const file of files) {
          try {
            await webContainer.fs.writeFile(file.path, file.content);
            console.log(`✅ File written: ${file.path}`);
          } catch (error) {
            console.error(`Failed to write file ${file.path}:`, error);
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
          if (isMounted) {
            console.log('Server ready on:', serverUrl);
            onOutput?.(`\r\nServer ready on: ${serverUrl}\n`);
            setUrl(serverUrl);
          }
        });

      } catch (err) {
        console.error('Server error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to start server');
          onOutput?.(`\r\n❌ Error: ${err instanceof Error ? err.message : 'Failed to start server'}\n`);
        }
      }
    }

    startDevServer();

    return () => {
      isMounted = false;
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
        <div className="text-center text-red-500">
          <p className="text-lg mb-2">Error</p>
          <p className="text-sm">{error}</p>
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