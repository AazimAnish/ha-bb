'use client';

import React from 'react';
import { Code2, Eye } from 'lucide-react';
import { TabViewProps } from '@/types';

export function TabView({ active, onChange, tabs }: TabViewProps) {
  return (
    <div className="flex flex-col h-full bg-neutral-900">
      <div className="flex items-center px-4 py-2 border-b border-neutral-800">
        <button
          onClick={() => onChange('code')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            active === 'code'
              ? 'bg-[#F14A00]/20 text-white border border-[#F14A00]/30'
              : 'text-gray-400 hover:text-white hover:bg-[#F14A00]/10'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Code
        </button>
        <button
          onClick={() => onChange('preview')}
          className={`flex items-center gap-2 px-4 py-2 ml-2 rounded-md transition-colors ${
            active === 'preview'
              ? 'bg-[#F14A00]/20 text-white border border-[#F14A00]/30'
              : 'text-gray-400 hover:text-white hover:bg-[#F14A00]/10'
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {active === 'code' ? (
          <div className="h-full">{tabs.code}</div>
        ) : (
          <div className="h-full">{tabs.preview}</div>
        )}
      </div>
    </div>
  );
}