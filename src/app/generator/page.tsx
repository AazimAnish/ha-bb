'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StepsList } from '@/components/StepList';
import { FileExplorer } from '@/components/FileExplorer';
import { TabView } from '@/components/TabView';
import { CodeEditor } from '@/components/CodeEditor';
import { Terminal } from '@/components/Terminal';
import { 
  Step, 
  FileItem, 
  StepType, 
  Message, 
  FileOperation, 
  FileSystemTree,
  StepStatus 
} from '@/types';
import { Loader } from '@/components/Loader';
import { useWebContainer } from '@/hooks/useWebContainer';
import { parseXml } from '@/lib/steps';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { BuildStep, createBuildStep } from '@/lib/steps';
import { PreviewFrame } from '@/components/PreviewFrame';
import { saveProject, getProject, updateProject } from '@/lib/supabase';
import { ProjectSelector } from '@/components/ProjectSelector';
import { toast } from '@/components/ui/use-toast';

const STEP_STATUS: Record<string, StepStatus> = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

function GeneratorContent() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt');
  const [userPrompt, setUserPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { webcontainer, error: webcontainerError, isBooting } = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<{path: string; content: string} | null>(null);
  const [currentBuildStep, setCurrentBuildStep] = useState<Step | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<FileOperation[]>([]);

  useEffect(() => {
    if (webcontainerError) {
      toast({
        title: "WebContainer Error",
        description: webcontainerError.message,
        variant: "destructive"
      });
    }
  }, [webcontainerError]);

  useEffect(() => {
    const processPendingOperations = async () => {
      if (!webcontainer || pendingOperations.length === 0) return;

      const operations = [...pendingOperations];
      setPendingOperations([]);

      for (const op of operations) {
        try {
          switch (op.type) {
            case 'create':
            case 'edit':
              if (op.content) {
                await webcontainer.fs.writeFile(op.path, op.content);
              }
              break;
            case 'delete':
              await webcontainer.fs.rm(op.path, { recursive: true, force: true });
              break;
            case 'rename':
              if (op.newPath) {
                await webcontainer.fs.rename(op.path, op.newPath);
              }
              break;
          }
        } catch (err) {
          console.error(`Failed to process operation ${op.type} on ${op.path}:`, err);
          toast({
            title: "Operation Failed",
            description: `Failed to ${op.type} ${op.path}`,
            variant: "destructive"
          });
        }
      }
    };

    processPendingOperations();
  }, [webcontainer, pendingOperations]);

  useEffect(() => {
    const updateFiles = async () => {
      const updatedSteps = steps.filter(({status}) => status === STEP_STATUS.PENDING).map(step => {
        if (step?.type === StepType.CreateFile || step?.type === StepType.EditFile) {
          setPendingOperations(prev => [...prev, {
            type: step.type === StepType.CreateFile ? 'create' : 'edit',
            path: step.path!,
            content: step.code
          }]);
        } else if (step?.type === StepType.DeleteFile) {
          setPendingOperations(prev => [...prev, {
            type: 'delete',
            path: step.path!
          }]);
        }
        return {
          ...step,
          status: STEP_STATUS.COMPLETED
        };
      });

      if (updatedSteps.length > 0) {
        setSteps(prev => prev.map(s => 
          updatedSteps.find(us => us.id === s.id) || s
        ));
      }
    };

    updateFiles();
  }, [steps]);

  useEffect(() => {
    const loadExistingProject = async () => {
      const id = searchParams.get('projectId');
      if (id) {
        try {
        setProjectId(id);
        const project = await getProject(id);
        if (project) {
          setFiles(project.files);
          setLlmMessages(project.llm_messages);
            setCurrentStep(project.current_step || 1);
            if (project.prompt) {
              setUserPrompt(project.prompt);
            }
          }
        } catch (err) {
          console.error('Failed to load project:', err);
          toast({
            title: "Load Failed",
            description: "Failed to load project",
            variant: "destructive"
          });
        }
      }
    };

    loadExistingProject();
  }, [searchParams]);

  const handleFileChange = useCallback(async (path: string, content: string) => {
    try {
      setPendingOperations(prev => [...prev, {
        type: 'edit',
        path,
        content
      }]);

      // Update files state
      setFiles(prevFiles => {
        const updateFileContent = (items: FileItem[]): FileItem[] => {
          return items.map(item => {
            if (item.path === path) {
              return { ...item, content };
            }
            if (item.children) {
              return {
                ...item,
                children: updateFileContent(item.children)
              };
            }
            return item;
          });
        };
        return updateFileContent(prevFiles);
      });

      // Save project if exists
      if (projectId) {
        await updateProject(projectId, {
            files,
          llm_messages: llmMessages,
          current_step: currentStep
        });
      }
    } catch (err) {
      console.error('Failed to save file:', err);
      toast({
        title: "Save Failed",
        description: "Failed to save file changes",
        variant: "destructive"
      });
    }
  }, [files, projectId, llmMessages, currentStep]);

  const handleFileSelect = useCallback((file: FileItem) => {
    setSelectedFile(file);
    setStreamingContent('');
  }, []);

  const handleStepClick = useCallback((stepId: number) => {
    setCurrentStep(stepId);
    const step = steps.find(s => s.id === stepId);
    if (step?.type === StepType.CreateFile && step.path) {
      setSelectedFile({
        name: step.path.split('/').pop() || '',
        type: 'file',
        path: step.path,
        content: step.code || ''
      });
    }
  }, [steps]);

  const createMountStructure = useCallback((files: FileItem[]): FileSystemTree => {
    const mountStructure: FileSystemTree = {};

    const processFile = (file: FileItem, isRootFolder: boolean) => {  
      if (file.type === 'folder') {
        const directory: FileSystemTree = {};
        if (file.children) {
          file.children.forEach(child => {
            const result = processFile(child, false);
            if (result) {
              directory[child.name] = result;
            }
          });
        }
        if (isRootFolder) {
          mountStructure[file.name] = { directory };
        }
        return { directory };
      } else {
        const fileNode = {
          file: {
            contents: file.content || ''
          }
        };
        if (isRootFolder) {
          mountStructure[file.name] = fileNode;
        }
        return fileNode;
      }
    };

    files.forEach(file => processFile(file, true));
    return mountStructure;
  }, []);

  useEffect(() => {
    if (!webcontainer || !files.length) return;

    const mountFiles = async () => {
      try {
        const structure = createMountStructure(files);
        await webcontainer.mount(structure);
      } catch (err) {
        console.error('Failed to mount files:', err);
        toast({
          title: "Mount Error",
          description: "Failed to mount project files",
          variant: "destructive"
        });
      }
    };

    mountFiles();
  }, [webcontainer, files, createMountStructure]);

  return (
    <div className="flex flex-col h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <FileExplorer 
            files={files} 
            onSelect={handleFileSelect}
            selected={selectedFile?.path}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60}>
          <TabView
            active={activeTab}
            onChange={setActiveTab}
            tabs={{
              code: (
                <CodeEditor 
                  file={selectedFile} 
                  onSave={handleFileChange}
                  readOnly={loading}
                />
              ),
              preview: (
                <PreviewFrame 
                  webContainer={webcontainer} 
                  files={files}
                  isLoading={loading || isBooting}
                />
              )
            }}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={20} minSize={15}>
          <StepsList
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      <Terminal
        webContainer={webcontainer}
        isLoading={loading || isBooting}
      />
      {loading && <Loader />}
    </div>
  );
}

export default function GeneratorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-neutral-900">
        <div className="text-center">
          <Loader className="w-8 h-8 mb-4 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-400">Loading generator...</p>
        </div>
      </div>
    }>
      <GeneratorContent />
    </Suspense>
  );
}