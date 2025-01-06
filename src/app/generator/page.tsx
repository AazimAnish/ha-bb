'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { StepsList } from '@/components/StepList';
import { FileExplorer } from '@/components/FileExplorer';
import { TabView } from '@/components/TabView';
import { CodeEditor } from '@/components/CodeEditor';
import { Terminal } from '@/components/Terminal';
import { Step, FileItem, StepType } from '@/types';
import { Loader } from '@/components/Loader';
import { useWebContainer } from '@/hooks/useWebContainer';
import { parseXml } from '@/lib/steps';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { BuildStep, createBuildStep } from '@/lib/steps';
import { PreviewFrame } from '@/components/PreviewFrame';

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function GeneratorPage() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt');
  const [userPrompt, setUserPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<{path: string; content: string} | null>(null);
  const [currentBuildStep, setCurrentBuildStep] = useState<Step | null>(null);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? [];
        let currentFileStructure = [...originalFiles];
        let finalAnswerRef = currentFileStructure;
  
        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder = `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);
  
          if (!parsedPath.length) {
            let file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            let folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }
            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }
    })

    if (updateHappened) {
      setFiles(originalFiles)
      setSteps(steps => steps.map((s: Step) => ({
        ...s,
        status: "completed" as const
      })));
    }
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};
  
      const processFile = (file: FileItem, isRootFolder: boolean) => {  
        if (file.type === 'folder') {
          mountStructure[file.name] = {
            directory: file.children ? 
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              ) 
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }
        return mountStructure[file.name];
      };
  
      files.forEach(file => processFile(file, true));
      return mountStructure;
    };
  
    const mountStructure = createMountStructure(files);
    webcontainer?.webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    if (!prompt) return;

    setLoading(true);
    setStreamingContent('');
    setError(null);
    setFiles([]);
    setSteps([]);
    setCurrentBuildStep(null);
    
    try {
        // Create initial Vite project structure
        const viteStructure = [
            {
                path: '/index.html',
                code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
            },
            {
                path: '/src/main.jsx',
                code: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
            },
            {
                path: '/src/App.jsx',
                code: `import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
    </>
  )
}

export default App`
            },
            {
                path: '/vite.config.js',
                code: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`
            },
            {
                path: '/package.json',
                code: `{
  "name": "my-react-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "vite": "^5.0.8"
  }
}`
            }
        ];

        // Create each file with proper streaming and steps
        for (const file of viteStructure) {
            const newStep: Step = {
                id: Date.now(),
                title: `Create ${file.path}`,
                description: `Creating file: ${file.path}`,
                type: StepType.CreateFile,
                status: 'in-progress',
                path: file.path,
                code: file.code
            };

            // Add step and show streaming
            setSteps(prev => [...prev, newStep]);
            setCurrentBuildStep(newStep);
            setStreamingContent(`Creating file: ${file.path}\n\n${file.code}`);
            setSelectedFile(null);

            // Show streaming effect
            await new Promise(resolve => setTimeout(resolve, 500));

            // Create the file
            handleFileChange(file.path, file.code);

            // Mark step as completed
            setSteps(prev => prev.map(s => 
                s.id === newStep.id 
                    ? { ...s, status: 'completed' as const }
                    : s
            ));

            // Delay between files
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // After creating all vite files, install dependencies and start dev server
        if (webcontainer?.webcontainer) {
            // Install dependencies
            const installProcess = await webcontainer.webcontainer.spawn('npm', ['install']);
            setStreamingContent(prev => `${prev}\n\nInstalling dependencies...`);
            
            // Wait for installation to complete
            const installExitCode = await installProcess.exit;
            
            if (installExitCode !== 0) {
                throw new Error('Installation failed');
            }

            // Start the dev server
            const devProcess = await webcontainer.webcontainer.spawn('npm', ['run', 'dev', '--', '--host']);
            
            // Listen to server output
            const reader = devProcess.output.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                setStreamingContent(prev => `${prev}\n${value}`);
            }

            // Wait for server to be ready
            await new Promise<void>((resolve) => {
                const checkServer = () => {
                    if (webcontainer.webcontainer?.fs) {
                        resolve();
                    } else {
                        setTimeout(checkServer, 100);
                    }
                };
                checkServer();
            });
        }

        // Continue with the rest of your init function...
        const templateResponse = await fetch('/api/groq', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({ 
                type: "template",
                messages: [{ content: prompt.trim() }] 
            })
        });
        
        if (!templateResponse.ok) {
            throw new Error(`Template API error: ${templateResponse.status}`);
        }

        const templateData = await templateResponse.json();
        
        // Parse and create files one by one
        if (templateData.uiPrompts?.[0]) {
            const templateSteps = parseXml(templateData.uiPrompts[0]);
            
            for (const step of templateSteps) {
                if (step.type === StepType.CreateFile && step.path && step.code) {
                    // Create new step
                    const newStep: Step = {
                        id: Date.now(),
                        title: `Create ${step.path}`,
                        description: `Creating file: ${step.path}`,
                        type: StepType.CreateFile,
                        status: 'in-progress',
                        path: step.path,
                        code: step.code
                    };

                    // Add step to list and set as current
                    setSteps(prev => [...prev, newStep]);
                    setCurrentBuildStep(newStep);
                    
                    // Show streaming content in code editor
                    setStreamingContent(`Creating file: ${step.path}\n\n${step.code}`);
                    setSelectedFile(null); // Clear selected file to show streaming

                    // Small delay to show streaming
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Create the file in file explorer
                    handleFileChange(step.path, step.code);

                    // Update step status to completed
                    setSteps(prev => prev.map(s => 
                        s.id === newStep.id 
                            ? { ...s, status: 'completed' as const }
                            : s
                    ));
                    
                    // Another small delay before next step
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
        }

        // Get implementation response
        const stepsResponse = await fetch('/api/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [...(templateData.prompts || []), { role: "user", content: prompt }]
            })
        });
        
        if (!stepsResponse.ok) {
            const errorData = await stepsResponse.json();
            throw new Error(errorData.error || `Steps API error: ${stepsResponse.status}`);
        }

        const stepsData = await stepsResponse.json();
        console.log('GROQ Implementation Response:', stepsData);

        // Parse implementation files
        if (stepsData.response) {
            const implementationSteps = parseXml(stepsData.response);
            
            // Create implementation files one by one
            for (const step of implementationSteps) {
                if (step.type === StepType.CreateFile && step.path && step.code) {
                    handleFileChange(step.path, step.code);
                    // Add small delay to show streaming effect
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }

        setLlmMessages([
            ...(templateData.prompts || []).map((content: string) => ({ 
                role: "user" as const, 
                content 
            })),
            { role: "user" as const, content: prompt },
            { role: "assistant" as const, content: stepsData.response }
        ]);

    } catch (error) {
        console.error('Error:', error);
        let errorMessage = 'An unexpected error occurred';
        
        if (error instanceof Error) {
            try {
                const errorData = JSON.parse(error.message);
                errorMessage = errorData.details || errorData.error || error.message;
            } catch {
                errorMessage = error.message;
            }
        }
        
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
  }

  const handleSendPrompt = async () => {
    if (!userPrompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...llmMessages, { role: "user", content: userPrompt }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('GROQ Chat Response:', data);

      if (!data.response) {
        throw new Error('Invalid response format');
      }

      setLlmMessages(messages => [
        ...messages,
        { role: "user" as const, content: userPrompt },
        { role: "assistant" as const, content: data.response }
      ]);
      
      const newSteps = parseXml(data.response);
      setSteps(currentSteps => [
        ...currentSteps,
        ...newSteps.map((x: Step) => ({
          ...x,
          status: "pending" as const
        }))
      ]);

      setUserPrompt("");
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message);
          setError(errorData.details || errorData.error || error.message);
        } catch {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, [prompt]);

  const handleStepComplete = (step: BuildStep) => {
    setSteps(currentSteps => {
      if (currentSteps.some(s => s.title === step)) {
        return currentSteps;
      }
      return [...currentSteps, createBuildStep(step, getStepDescription(step))];
    });
  };

  function getStepDescription(step: BuildStep): string {
    switch (step) {
      case BuildStep.INIT:
        return "Setting up Next.js development environment";
      case BuildStep.CREATE:
        return "Creating project files and structure";
      case BuildStep.INSTALL:
        return "Installing required dependencies";
      case BuildStep.SETUP:
        return "Configuring project settings";
      case BuildStep.IMPLEMENT:
        return "Implementing Todo application features";
      default:
        return "";
    }
  }

  const handleFileChange = (path: string, content: string) => {
    setFiles(currentFiles => {
        const newFiles = [...currentFiles];
        const pathParts = path.split('/').filter(Boolean);
        let currentLevel = newFiles;
        let currentPath = '';

        // Create folders first
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            currentPath += '/' + part;
            
            let folder = currentLevel.find(f => f.path === currentPath);
            if (!folder) {
                folder = {
                    name: part,
                    type: 'folder',
                    path: currentPath,
                    children: []
                };
                currentLevel.push(folder);
            }
            currentLevel = folder.children || [];
        }

        // Create/update file
        const fileName = pathParts[pathParts.length - 1];
        currentPath += '/' + fileName;
        
        const fileItem: FileItem = {
            name: fileName,
            type: 'file',
            path: currentPath,
            content: content
        };
        
        const existingFileIndex = currentLevel.findIndex(f => f.path === currentPath);
        if (existingFileIndex >= 0) {
            currentLevel[existingFileIndex] = fileItem;
        } else {
            currentLevel.push(fileItem);
        }

        // Show the new file in code editor
        setSelectedFile(fileItem);
        
        return newFiles;
    });
  };

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
    // Clear streaming content when selecting a file
    setStreamingContent('');
  };

  const handleStepClick = (stepId: number) => {
    const selectedStep = steps.find(s => s.id === stepId);
    if (selectedStep?.type === StepType.CreateFile && selectedStep.path && selectedStep.code) {
      // Clear any streaming content
      setStreamingContent('');
      
      // Find the corresponding file
      const findFile = (files: FileItem[], path: string): FileItem | null => {
        for (const file of files) {
          if (file.path === path) {
            return file;
          }
          if (file.type === 'folder' && file.children) {
            const found = findFile(file.children, path);
            if (found) return found;
          }
        }
        return null;
      };

      const file = findFile(files, selectedStep.path);
      if (file) {
        setSelectedFile(file);
      } else {
        // If file not found in explorer yet, show the step's code
        setSelectedFile({
          name: selectedStep.path.split('/').pop() || '',
          type: 'file',
          path: selectedStep.path,
          content: selectedStep.code
        });
      }
    }
    setCurrentStep(stepId);
  };

  // Memoize the output handler
  const handleOutput = useCallback((output: string) => {
    setStreamingContent(prev => prev + output);
  }, []); // Empty dependency array since we only need to create this once

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {error && (
        <div className="bg-[#F14A00] text-white px-6 py-4">
          <div className="container mx-auto">
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
      
      <ResizablePanelGroup direction="horizontal">
        {/* Left Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-screen border-r border-neutral-800 overflow-auto">
            <div className="p-4">
              <h1 className="text-xl font-semibold text-white mb-4">Build Steps</h1>
              
              {/* Steps and Files Combined View */}
              <div className="space-y-4">
                <StepsList
                  steps={steps}
                  currentStep={currentBuildStep?.id || 0}
                  onStepClick={handleStepClick}
                />
                <FileExplorer 
                  files={files} 
                  onFileSelect={handleFileSelect}
                />
              </div>

              {/* Prompt Input */}
              {!(loading || !templateSet) && (
                <div className="mt-4">
                  <textarea 
                    value={userPrompt} 
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="w-full h-24 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white resize-none"
                    placeholder="Enter additional instructions..."
                  />
                  <button 
                    onClick={handleSendPrompt}
                    className="mt-2 w-full bg-[#F14A00] hover:bg-[#D93F00] text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Main Content */}
        <ResizablePanel defaultSize={80}>
          <ResizablePanelGroup direction="vertical">
            {/* Code/Preview Area */}
            <ResizablePanel defaultSize={70}>
              <div className="h-full p-4">
                <TabView activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="mt-2 h-[calc(100%-3rem)]">
                  {activeTab === 'code' ? (
                    <CodeEditor 
                      file={selectedFile} 
                      streamingContent={streamingContent}
                      isLoading={loading && !templateSet}
                    />
                  ) : (
                    <PreviewFrame 
                      webContainer={webcontainer?.webcontainer}
                      files={files}
                      isLoading={loading}
                      onOutput={handleOutput}
                    />
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Terminal */}
            <ResizablePanel defaultSize={30}>
              <div className="h-full border-t border-neutral-800">
                {webcontainer?.webcontainer && (
                  <Terminal 
                    webContainer={webcontainer.webcontainer}
                    onOutput={handleOutput}
                    onStepComplete={handleStepComplete}
                    onFileChange={handleFileChange}
                  />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}