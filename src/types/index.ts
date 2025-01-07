import { WebContainer } from '@webcontainer/api';
import { ReactNode } from 'react';

export enum StepType {
  CreateFile = "create-file",
  Step = "step",
  CreateFolder = "create-folder", 
  EditFile = "edit-file",
  DeleteFile = "delete-file",
  RunScript = "run-script",
  InstallDependency = "install-dependency"
}

export type StepStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface Step {
  id: number;
  title: string;
  description: string;
  type: StepType;
  status: StepStatus;
  code?: string;
  path?: string;
  error?: string;
  command?: string;
  dependencies?: string[];
}

export interface Project {
  id: string;
  name: string;
  prompt: string;
  files: FileItem[];
  llm_messages: Message[];
  created_at: string;
  updated_at: string;
  template?: string;
  current_step?: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  content?: string;
  path: string;
  lastModified?: string;
  size?: number;
  error?: string;
}

export type FileSystemTree = {
  [name: string]: {
    file: {
      contents: string;
    };
  } | {
    directory: FileSystemTree;
  };
};

export interface MountOptions {
  mountPoint?: string;
}

export interface FileOperation {
  type: 'create' | 'edit' | 'delete' | 'rename';
  path: string;
  content?: string;
  newPath?: string;
}

export interface FileExplorerProps {
  files: FileItem[];
  onSelect: (file: FileItem) => void;
  selected?: string;
}

export interface TabViewProps {
  active: 'code' | 'preview';
  onChange: (tab: 'code' | 'preview') => void;
  tabs: {
    code: ReactNode;
    preview: ReactNode;
  };
}

export interface CodeEditorProps {
  file: FileItem | null;
  onSave: (path: string, content: string) => Promise<void>;
  readOnly?: boolean;
}

export interface PreviewFrameProps {
  webContainer: WebContainer | null;
  files: FileItem[];
  isLoading?: boolean;
}

export interface TerminalProps {
  webContainer: WebContainer | null;
  isLoading?: boolean;
}

export interface StepsListProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface DatabaseError extends Error {
  code: string;
  details?: string;
  hint?: string;
}