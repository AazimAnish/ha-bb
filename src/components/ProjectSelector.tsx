import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SparklesCore } from "@/components/ui/sparkles";

export function ProjectSelector({ currentProjectId }: { currentProjectId: string | null }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data);
        if (!currentProjectId && data.length > 0) {
          router.push(`/generator?projectId=${data[0].id}`);
        }
      }
      setIsLoading(false);
    }

    loadProjects();
  }, [currentProjectId]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-4"
    >
      {currentProjectId && (
        <div className="text-sm text-gray-400">
          Project ID: <span className="font-mono text-[#F14A00]">{currentProjectId}</span>
        </div>
      )}
      
      <div className="text-gray-400 text-center">Select existing project</div>
      
      <div className="relative">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F14A00]/20 to-[#F14A00]/10 backdrop-blur-sm" />
        <select
          className="bg-gray-900/50 backdrop-blur-sm text-gray-100 px-4 py-2 rounded-lg border border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#F14A00] focus:border-transparent transition-all duration-200 min-w-[200px]"
          value={currentProjectId || ''}
          onChange={(e) => {
            const id = e.target.value;
            if (id) {
              router.push(`/generator?projectId=${id}`);
            }
          }}
        >
          <option value="" className="bg-gray-900">Select Project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id} className="bg-gray-900">
              {project.prompt.substring(0, 50)}...
            </option>
          ))}
        </select>
      </div>
      
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F14A00]/30 to-[#F14A00]/20 backdrop-blur-sm" />
        <div className="absolute inset-0">
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={800}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />
        </div>
        <Button
          onClick={() => router.push('/')}
          className="relative h-14 px-8 bg-[#F14A00]/60 hover:bg-[#D93F00] text-white font-medium text-lg transition-all duration-200 shadow-lg border border-[#F14A00]/30"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default ProjectSelector;