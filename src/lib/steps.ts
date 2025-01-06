import { Step, StepType } from '@/types';

export enum BuildStep {
  INIT = "Initializing Next.js project",
  CREATE = "Creating project structure",
  INSTALL = "Installing dependencies",
  SETUP = "Setting up application",
  IMPLEMENT = "Implementing features"
}

export function parseXml(xmlString: string): Step[] {
  if (!xmlString || typeof xmlString !== 'string') return [];

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const steps: Step[] = [];
    let stepId = 1;

    const fileActions = xmlDoc.getElementsByTagName('boltAction');
    for (const action of Array.from(fileActions)) {
      const type = action.getAttribute('type');
      const filePath = action.getAttribute('filePath');
      
      if (type === 'file' && filePath) {
        steps.push({
          id: stepId++,
          title: `Create ${filePath}`,
          description: `Creating file: ${filePath}`,
          type: StepType.CreateFile,
          status: 'pending',
          path: filePath,
          code: action.textContent || ''
        });
      }
    }
    return steps;
  } catch (error) {
    console.error('Error parsing XML:', error);
    return [];
  }
}

export function createBuildStep(step: BuildStep, description: string): Step {
  return {
    id: Date.now(),
    title: step,
    description,
    status: "pending",
    type: StepType.Step
  };
}