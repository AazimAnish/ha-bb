import React from 'react';
import { FolderTree, MessageSquare } from 'lucide-react';

interface SidebarTabsProps {
  activeTab: 'explorer' | 'chat';
  onTabChange: (tab: 'explorer' | 'chat') => void;
}

export function SidebarTabs({ activeTab, onTabChange }: SidebarTabsProps) {
  return (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => onTabChange('explorer')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'explorer'
            ? 'bg-[#F14A00]/20 text-white border border-[#F14A00]/30'
            : 'text-gray-400 hover:text-white hover:bg-[#F14A00]/10'
        }`}
      >
        <FolderTree className="w-4 h-4" />
        Explorer
      </button>
      <button
        onClick={() => onTabChange('chat')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'chat'
            ? 'bg-[#F14A00]/20 text-white border border-[#F14A00]/30'
            : 'text-gray-400 hover:text-white hover:bg-[#F14A00]/10'
        }`}
      >
        <MessageSquare className="w-4 h-4" />
        AI Chat
      </button>
    </div>
  );
} 