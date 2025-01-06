export enum StepType {
  CreateFile = "create-file",
  Step = "step",
  CreateFolder = "create-folder", 
  EditFile = "edit-file",
  DeleteFile = "delete-file",
  RunScript = "run-script"
}

export interface Step {
  id: number;
  title: string;
  description: string;
  type: StepType;
  status: 'pending' | 'in-progress' | 'completed';
  code?: string;
  path?: string;
}

export interface Project {
  prompt: string;
  steps: Step[];
}

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  content?: string;
  path: string;
}

export interface FileViewerProps {
  file: FileItem | null;
  onClose: () => void;
}

export interface Project {
  id: number;
  user_id: string;
  files: Record<string, string>;
  created_at: string;
  metadata?: {
    file_count: number;
    total_size: number;
    timestamp: number;
  };
}