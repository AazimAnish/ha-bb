import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Step } from '@/types';

interface StepsListProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function StepsList({ steps, currentStep, onStepClick }: StepsListProps) {
  return (
    <div className="bg-black border border-[#F14A00]/20 rounded-lg shadow-lg p-4 h-full overflow-auto">
      <h2 className="text-lg font-semibold mb-4 text-white">Build Steps</h2>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={`${step.id}-${index}`}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              currentStep === step.id
                ? 'bg-[#F14A00]/20 border border-[#F14A00]/30'
                : 'hover:bg-[#F14A00]/10'
            }`}
            onClick={() => onStepClick(step.id)}
          >
            <div className="flex items-center gap-2">
              {step.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-[#F14A00]" />
              ) : step.status === 'in-progress' ? (
                <Clock className="w-5 h-5 text-[#F14A00]/60" />
              ) : (
                <Circle className="w-5 h-5 text-gray-600" />
              )}
              <h3 className="font-medium text-white">{step.title}</h3>
            </div>
            <p className="text-sm text-gray-400 mt-2">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}