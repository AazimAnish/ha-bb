import React from 'react';
import { FolderTree, ListTodo } from 'lucide-react';

interface ExplorerTabsProps {
  activeTab: 'files' | 'steps';
  onTabChange: (tab: 'files' | 'steps') => void;
}

export function ExplorerTabs({ activeTab, onTabChange }: ExplorerTabsProps) {
  return (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => onTabChange('steps')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'steps'
            ? 'bg-[#F14A00]/20 text-white border border-[#F14A00]/30'
            : 'text-gray-400 hover:text-white hover:bg-[#F14A00]/10'
        }`}
      >
        <ListTodo className="w-4 h-4" />
        Build Steps
      </button>
      <button
        onClick={() => onTabChange('files')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'files'
            ? 'bg-[#F14A00]/20 text-white border border-[#F14A00]/30'
            : 'text-gray-400 hover:text-white hover:bg-[#F14A00]/10'
        }`}
      >
        <FolderTree className="w-4 h-4" />
        File Explorer
      </button>
    </div>
  );
} 