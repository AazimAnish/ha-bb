import React, { useState } from 'react';
import { FolderTree, File, ChevronRight, ChevronDown } from 'lucide-react';
import { FileExplorerProps, FileItem } from '@/types';

interface FileNodeProps {
  item: FileItem;
  depth: number;
  onSelect: (file: FileItem) => void;
  selected?: string;
}

function FileNode({ item, depth, onSelect, selected }: FileNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(item);
    }
  };

  const isSelected = selected === item.path;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 p-2 hover:bg-[#F14A00]/10 rounded-md cursor-pointer ${
          isSelected ? 'bg-[#F14A00]/20' : ''
        }`}
        style={{ paddingLeft: `${depth * 1.5}rem` }}
        onClick={handleClick}
      >
        {item.type === 'folder' && (
          <span className="text-gray-400">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        {item.type === 'folder' ? (
          <FolderTree className="w-4 h-4 text-blue-400" />
        ) : (
          <File className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-gray-200">{item.name}</span>
      </div>
      {item.type === 'folder' && isExpanded && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileNode
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onSelect={onSelect}
              selected={selected}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ files, onSelect, selected }: FileExplorerProps) {
  return (
    <div className="bg-black border border-[#F14A00]/20 rounded-lg shadow-lg p-4 h-full overflow-auto">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
        <FolderTree className="w-5 h-5 text-[#F14A00]" />
        File Explorer
      </h2>
      <div className="space-y-1">
        {files.map((file, index) => (
          <FileNode
            key={`${file.path}-${index}`}
            item={file}
            depth={0}
            onSelect={onSelect}
            selected={selected}
          />
        ))}
      </div>
    </div>
  );
}