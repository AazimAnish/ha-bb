'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StepsList } from '@/components/StepList';
import { FileExplorer } from '@/components/FileExplorer';
import { TabView } from '@/components/TabView';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewFrame } from '@/components/PreviewFrame';
import { Step, FileItem, StepType } from '@/types';
import { Loader } from '@/components/Loader';
import { useWebContainer } from '@/hooks/useWebContainer';
import { parseXml } from '@/lib/steps';

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
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    if (!prompt) return;

    setLoading(true);
    try {
      const templateResponse = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: "template",
          messages: [{ content: prompt.trim() }] 
        })
      });
      
      if (!templateResponse.ok) {
        throw new Error(`Template API error: ${templateResponse.status}`);
      }
      
      const templateData = await templateResponse.json();
      setTemplateSet(true);
      
      const { prompts, uiPrompts } = templateData;

      if (!Array.isArray(uiPrompts) || !uiPrompts[0]) {
        throw new Error('Invalid template response format');
      }

      const initialSteps = parseXml(uiPrompts[0]);
      setSteps(initialSteps.map((x: Step) => ({
        ...x,
        status: "pending" as const
      })));

      const stepsResponse = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...prompts, { role: "user", content: prompt }]
        })
      });
      
      if (!stepsResponse.ok) {
        throw new Error(`Steps API error: ${stepsResponse.status}`);
      }

      const stepsData = await stepsResponse.json();
      
      if (!stepsData.response) {
        throw new Error('Invalid steps response format');
      }

      const implementationSteps = parseXml(stepsData.response);
      setSteps(s => [...s, ...implementationSteps.map(x => ({
        ...x,
        status: "pending" as const
      }))]);

      setLlmMessages([
        ...prompts.map((content: string) => ({ role: "user" as const, content })),
        { role: "user" as const, content: prompt },
        { role: "assistant" as const, content: stepsData.response }
      ]);

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
        ...newSteps.map(x => ({
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

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {error && (
        <div className="bg-[#F14A00] text-white px-6 py-4">
          <div className="container mx-auto">
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
      <header className="bg-black border-b border-[#F14A00]/20 px-6 py-4">
        <h1 className="text-xl font-semibold text-white">Website Builder</h1>
        <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-6 p-6">
          <div className="col-span-1 space-y-6 overflow-auto">
            <div>
              <div className="max-h-[75vh] overflow-scroll">
                <StepsList
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                />
              </div>
              <div>
                <div className='flex'>
                  <br />
                  {(loading || !templateSet) && <Loader />}
                  {!(loading || !templateSet) && (
                    <div className='flex w-full gap-2'>
                      <textarea 
                        value={userPrompt} 
                        onChange={(e) => setUserPrompt(e.target.value)}
                        className='p-2 w-full bg-transparent border border-[#F14A00]/20 rounded-lg text-white placeholder-gray-400 focus:border-[#F14A00]/50 focus:ring-[#F14A00]/30'
                        placeholder="Enter additional instructions..."
                      />
                      <button 
                        onClick={handleSendPrompt}
                        className='bg-[#F14A00]/60 hover:bg-[#D93F00] text-white px-4 rounded-lg transition-colors duration-200 border border-[#F14A00]/30'
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-1">
              <FileExplorer 
                files={files} 
                onFileSelect={setSelectedFile}
              />
          </div>
          <div className="col-span-2 bg-black border border-[#F14A00]/20 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="h-[calc(100%-4rem)]">
              {activeTab === 'code' ? (
                <CodeEditor file={selectedFile} />
              ) : (
                webcontainer && <PreviewFrame webContainer={webcontainer} files={files} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}