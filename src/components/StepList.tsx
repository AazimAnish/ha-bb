import React from 'react';
import { CheckCircle, Circle, Clock, Loader2, FileCode } from 'lucide-react';
import { Step, StepType } from '@/types';

interface StepsListProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function StepsList({ steps, currentStep, onStepClick }: StepsListProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isFileStep = step.type === StepType.CreateFile;
        
        return (
          <div
            key={`${step.id}-${index}`}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              isActive
                ? 'bg-[#F14A00]/20 border border-[#F14A00]/30'
                : 'hover:bg-neutral-900'
            }`}
            onClick={() => onStepClick(step.id)}
          >
            <div className="flex items-center gap-2">
              {step.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : step.status === 'in-progress' ? (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              ) : (
                <Circle className="w-4 h-4 text-neutral-500" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-medium ${
                    isActive ? 'text-[#F14A00]' : 'text-white'
                  }`}>
                    {step.title}
                  </h3>
                  {isFileStep && (
                    <FileCode className={`w-3 h-3 ${
                      isActive ? 'text-[#F14A00]' : 'text-neutral-400'
                    }`} />
                  )}
                </div>
                {step.description && (
                  <p className={`text-xs mt-1 ${
                    isActive ? 'text-[#F14A00]/80' : 'text-neutral-400'
                  }`}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}