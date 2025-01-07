import { createClient } from '@supabase/supabase-js';
import { FileItem, Project } from '@/types';
import { SupabaseError, DatabaseError } from '../types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function handleSupabaseError(error: unknown): never {
  console.error('Supabase operation failed:', error);
  
  let errorMessage = 'An unexpected error occurred';
  let errorDetails: SupabaseError = { message: errorMessage };
  
  if (error instanceof Error) {
    errorMessage = error.message;
    if ((error as DatabaseError).code) {
      const dbError = error as DatabaseError;
      errorDetails = {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint
      };
    }
  }
  
  throw new Error(JSON.stringify(errorDetails));
}

export async function saveProject(projectData: {
  prompt: string;
  files: FileItem[];
  llmMessages: { role: "user" | "assistant"; content: string }[];
}): Promise<Project> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        prompt: projectData.prompt,
        files: projectData.files,
        llm_messages: projectData.llmMessages,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from insert operation');
    
    return data;
  } catch (error) {
    handleSupabaseError(error);
  }
}

export async function getProject(projectId: string): Promise<Project> {
  try {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Project with ID ${projectId} not found`);
    
    return data;
  } catch (error) {
    handleSupabaseError(error);
  }
}

export async function updateProject(
  projectId: string, 
  updates: Partial<Project>
): Promise<void> {
  try {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const { error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
  }
}