'use client';

import React, { useEffect, useState } from 'react';
import { CodeEditorProps } from '@/types';
import { Loader, FileCode, FolderOpen } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { toast } from '@/components/ui/use-toast';

export function CodeEditor({ file, onSave, readOnly }: CodeEditorProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (file?.content !== undefined) {
      setContent(file.content);
    }
  }, [file]);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
    }
  };

  const handleSave = async () => {
    if (file && onSave && !readOnly) {
      setIsLoading(true);
      try {
        await onSave(file.path, content);
        toast({
          title: "File Saved",
          description: `Successfully saved ${file.path}`,
        });
      } catch (err) {
        console.error('Failed to save file:', err);
        toast({
          title: "Save Failed",
          description: `Failed to save ${file.path}`,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getFileExtension = (path: string | undefined): string => {
    if (!path) return 'typescript';
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
      scss: 'scss',
      less: 'less',
      json: 'json',
      html: 'html',
      xml: 'xml',
      md: 'markdown',
      py: 'python',
      rb: 'ruby',
      java: 'java',
      php: 'php',
      go: 'go',
      rs: 'rust',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      sh: 'shell',
      yaml: 'yaml',
      yml: 'yaml',
      sql: 'sql',
    };
    return languageMap[ext] || 'plaintext';
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900">
        <div className="text-center">
          <Loader className="w-8 h-8 mb-4 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-400">Saving file...</p>
        </div>
      </div>
    );
  }

  if (!file) {
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
    <div className="h-full bg-neutral-900 overflow-hidden flex flex-col">
      <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-neutral-400" />
          <span className="text-sm text-neutral-400 font-mono truncate max-w-[300px]">
            {file.path}
          </span>
        </div>
        {!readOnly && (
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-[#F14A00]/20 text-white hover:bg-[#F14A00]/30 rounded-md transition-colors border border-[#F14A00]/30"
          >
            Save
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={getLanguage(getFileExtension(file.path))}
          theme="vs-dark"
          value={content}
          onChange={handleChange}
          options={{
            readOnly: readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
          }}
          loading={
            <div className="h-full flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          }
        />
      </div>
    </div>
  );
}