import React, { useState, useEffect } from 'react';
import { FileItem } from '@/types';
import { Loader } from 'lucide-react';
import { AlertCircle, FileCode, FolderOpen } from 'lucide-react';

interface CodeEditorProps {
  file?: FileItem | null;
  streamingContent?: string;
  isLoading: boolean;
}

// Change to named export
export function CodeEditor({ file, streamingContent, isLoading }: CodeEditorProps) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (streamingContent) {
      // Animate the content appearing
      setContent('');
      const lines = streamingContent.split('\n');
      let currentLine = 0;
      
      const interval = setInterval(() => {
        if (currentLine < lines.length) {
          setContent(prev => prev + lines[currentLine] + '\n');
          currentLine++;
        } else {
          clearInterval(interval);
        }
      }, 50); // Adjust speed as needed

      return () => clearInterval(interval);
    } else if (file?.content) {
      setContent(file.content);
    }
  }, [file, streamingContent]);

  const getFileExtension = (path: string | undefined): string => {
    if (!path) return '';
    const parts = path.split('.');
    return parts[parts.length - 1].toLowerCase();
  };

  const getLanguage = (ext: string): string => {
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      css: 'css',
      json: 'json',
      html: 'html',
    };
    return languageMap[ext] || 'text';
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center">
          <Loader className="w-8 h-8 mb-4 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-400">Loading file contents...</p>
        </div>
      </div>
    );
  }

  if (!file && !streamingContent) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center text-neutral-400">
          <FolderOpen className="w-8 h-8 mb-4 mx-auto" />
          <p className="text-sm">Select a file to view code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-neutral-900 rounded-lg overflow-hidden flex flex-col">
      {file && (
        <div className="px-4 py-2 border-b border-neutral-800 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-neutral-400" />
          <span className="text-sm text-neutral-400 font-mono">{file.path}</span>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-sm font-mono text-neutral-300">
          <code className={`language-${getLanguage(getFileExtension(file?.path))}`}>
            {content || ''}
          </code>
        </pre>
      </div>
    </div>
  );
}