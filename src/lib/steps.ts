import { Step, StepType } from '@/types';

export function parseXml(xmlString: string): Step[] {
  // Handle empty or invalid XML
  if (!xmlString || typeof xmlString !== 'string') {
    return [];
  }

  try {
    let xmlDoc;
    if (typeof window !== 'undefined') {
      // Browser environment
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(xmlString, "text/xml");
    } else {
      // Server environment - return empty array for now
      // You can add server-side XML parsing if needed
      return [];
    }

    const steps: Step[] = [];
    let stepId = 1;

    // Parse file actions
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