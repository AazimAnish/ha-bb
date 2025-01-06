import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebContainer, WebContainerProcess } from '@webcontainer/api';
import 'xterm/css/xterm.css';
import { BuildStep } from '../lib/steps';
import { supabase } from '../lib/supabase';
import { Project } from '../types/index';

interface TerminalProps {
    webContainer: WebContainer | null;
    onOutput?: (output: string) => void;
    onStepComplete?: (step: BuildStep) => void;
    onFileChange?: (path: string, content: string) => void;
}

interface TerminalTabProps {
    activeTab: 'ai' | 'user';
    onTabChange: (tab: 'ai' | 'user') => void;
}

function TerminalTabs({ activeTab, onTabChange }: TerminalTabProps) {
    return (
        <div className="flex space-x-2 mb-4">
            <button
                onClick={() => onTabChange('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'ai'
                        ? 'bg-[#F14A00]/20 text-[#F14A00] border border-[#F14A00]/30'
                        : 'text-gray-400 hover:text-white hover:bg-[#F14A00]/10'
                }`}
            >
                🤖 AI Terminal
            </button>
            <button
                onClick={() => onTabChange('user')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'user'
                        ? 'bg-[#F14A00]/20 text-white border border-[#F14A00]/30'
                        : 'text-gray-400 hover:text-white hover:bg-[#F14A00]/10'
                }`}
            >
                👤 User Terminal
            </button>
        </div>
    );
}

export function Terminal({ webContainer, onOutput, onStepComplete, onFileChange }: TerminalProps) {
    const [activeTerminal, setActiveTerminal] = useState<'ai' | 'user'>('ai');
    const aiTerminalRef = useRef<HTMLDivElement>(null);
    const userTerminalRef = useRef<HTMLDivElement>(null);
    const aiXtermRef = useRef<XTerm | null>(null);
    const userXtermRef = useRef<XTerm | null>(null);
    const shellProcessRef = useRef<WebContainerProcess | null>(null);
    const aiFitAddonRef = useRef<FitAddon | null>(null);
    const userFitAddonRef = useRef<FitAddon | null>(null);
    const initRef = useRef<boolean>(false);
    const userInputWriterRef = useRef<WritableStreamDefaultWriter | null>(null);

    // Initialize terminals
    useEffect(() => {
        if (!aiTerminalRef.current || !userTerminalRef.current) return;

        const aiTerminal = new XTerm({
            convertEol: true,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            theme: {
                background: '#1a1a1a',
                foreground: '#F14A00',
            },
            cursorBlink: true,
        });

        const userTerminal = new XTerm({
            convertEol: true,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            theme: {
                background: '#000000',
                foreground: '#ffffff',
            },
            cursorBlink: true,
        });

        const aiFitAddon = new FitAddon();
        const userFitAddon = new FitAddon();

        aiFitAddonRef.current = aiFitAddon;
        userFitAddonRef.current = userFitAddon;

        aiTerminal.loadAddon(aiFitAddon);
        userTerminal.loadAddon(userFitAddon);

        requestAnimationFrame(() => {
            if (aiTerminalRef.current && userTerminalRef.current) {
                aiTerminal.open(aiTerminalRef.current);
                userTerminal.open(userTerminalRef.current);
                aiFitAddon.fit();
                userFitAddon.fit();
            }
        });

        aiXtermRef.current = aiTerminal;
        userXtermRef.current = userTerminal;

        userTerminalRef.current.addEventListener('click', () => {
            if (activeTerminal === 'user') {
                userXtermRef.current?.focus();
            }
        });

        return () => {
            aiTerminal.dispose();
            userTerminal.dispose();
        };
    }, [activeTerminal]);

    // Handle window resize
    useEffect(() => {
        function handleResize() {
            aiFitAddonRef.current?.fit();
            userFitAddonRef.current?.fit();

            if (shellProcessRef.current && userXtermRef.current) {
                shellProcessRef.current.resize({
                    cols: userXtermRef.current.cols,
                    rows: userXtermRef.current.rows,
                });
            }
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Move helper functions to component scope
    const initFS = async () => {
        try {
            await webContainer?.fs.mkdir('/.npm-cache', { recursive: true });
            await webContainer?.spawn('jsh', ['-c', 'chmod -R 777 /.npm-cache']);
            
            await webContainer?.fs.mkdir('/app', { recursive: true });
            await webContainer?.fs.mkdir('/app/src', { recursive: true });
            
            await webContainer?.spawn('jsh', ['-c', 'chmod -R 777 /app']);
            await webContainer?.spawn('jsh', ['-c', 'chown -R 1:1 /.npm-cache']);
            
        } catch (error) {
            if (!(error instanceof Error) || !error.message.includes('EEXIST')) {
                console.warn('Directory creation warning:', error);
                throw error;
            }
        }
    };

    // Add a function to display file creation in AI terminal
    const displayFileCreation = (aiTerminal: XTerm, path: string) => {
        aiTerminal.write(`\r\n📝 Creating file: ${path}\r\n`);
    };

    // Update the writeFile function to show progress
    const writeFile = async (path: string, content: string) => {
        try {
            const aiTerminal = aiXtermRef.current;
            if (aiTerminal) {
                displayFileCreation(aiTerminal, path);
            }

            const dirPath = path.split('/').slice(0, -1).join('/');
            if (dirPath) {
                await webContainer?.fs.mkdir(dirPath, { recursive: true });
            }
            
            await webContainer?.fs.writeFile(path, content, {
                encoding: 'utf-8',
            });
            
            await webContainer?.spawn('jsh', ['-c', `chmod 666 ${path}`]);
            
            // Notify with relative path for display in CodeEditor
            const relativePath = path.replace('/app/', '');
            onFileChange?.(relativePath, content);

            // Show success message
            if (aiTerminal) {
                aiTerminal.write(`\r\n✅ Created: ${path}\r\n`);
            }
        } catch (error) {
            console.error(`Failed to write file ${path}:`, error);
            if (aiXtermRef.current) {
                aiXtermRef.current.write(`\r\n❌ Error creating ${path}: ${error}\r\n`);
            }
            throw error;
        }
    };

    // Add a function to install dependencies and start server
    const setupProject = async (aiInput: WritableStreamDefaultWriter) => {
        const aiTerminal = aiXtermRef.current;
        if (!aiTerminal) return;

        try {
            aiTerminal.write('\r\n📦 Installing dependencies...\r\n');
            await aiInput.write('cd /app && npm install\n');

            aiTerminal.write('\r\n🚀 Starting development server...\r\n');
            await aiInput.write('cd /app && npm run dev\n');
        } catch (error) {
            console.error('Failed to setup project:', error);
            aiTerminal.write(`\r\n❌ Setup error: ${error}\r\n`);
        }
    };

    // Initialize shell and project
    useEffect(() => {
        if (!webContainer || !aiXtermRef.current || !userXtermRef.current || initRef.current) return;
        initRef.current = true;

        async function startShell() {
            const aiTerminal = aiXtermRef.current!;
            const userTerminal = userXtermRef.current!;

            try {
                await initFS();

                // Start shell processes
                const startShellProcess = async (terminal: XTerm) => {
                    try {
                        const process = await webContainer?.spawn('jsh', {
                            terminal: {
                                cols: terminal.cols,
                                rows: terminal.rows,
                            },
                            env: {
                                HOME: '/app',
                                PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
                                TERM: 'xterm-256color',
                                npm_config_cache: '/.npm-cache',
                                USER: '1',
                                npm_config_user: '1'
                            }
                        });
                        
                        if (!process) {
                            throw new Error('Failed to start shell process');
                        }
                        
                        return process;
                    } catch (error) {
                        console.error('Shell process error:', error);
                        terminal.write(`\r\n❌ Failed to start shell: ${error}\r\n`);
                        throw error;
                    }
                };

                // Start terminals
                const userShellProcess = await startShellProcess(userTerminal);
                if (!userShellProcess) return;
                shellProcessRef.current = userShellProcess;

                const aiShellProcess = await startShellProcess(aiTerminal);
                if (!aiShellProcess) return;

                // Connect terminal streams
                userShellProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            userTerminal.write(data);
                            onOutput?.(data);
                        },
                    })
                );

                aiShellProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            aiTerminal.write(data);
                        },
                    })
                );

                const aiInput = aiShellProcess.input.getWriter();
                userInputWriterRef.current = userShellProcess.input.getWriter();

                // Handle user input
                userTerminal.onData((data) => {
                    if (activeTerminal === 'user' && userInputWriterRef.current) {
                        userInputWriterRef.current.write(data);
                    }
                });

                // Show ready message
                aiTerminal.write('\r\n🔧 Environment ready for file creation...\r\n');

                // Server ready event handler
                webContainer?.on('server-ready', (port, url) => {
                    aiTerminal.write(`\r\n🌎 Server running at ${url}\r\n`);
                    onOutput?.(`Server running at ${url}`);
                });

                // Setup project after files are created
                await setupProject(aiInput);

            } catch (error) {
                console.error('Terminal error:', error);
                aiTerminal.write(`\r\n❌ Error: ${error}\r\n`);
            }
        }

        startShell();
    }, [webContainer, onOutput, onStepComplete, activeTerminal]);

    // Handle terminal focus
    useEffect(() => {
        if (activeTerminal === 'user') {
            userXtermRef.current?.focus();
        } else {
            aiXtermRef.current?.focus();
        }
    }, [activeTerminal]);

    const saveToSupabase = async (files: Record<string, string>, userId: string) => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([
                    {
                        user_id: userId,
                        files: files,
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return data as Project;
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            throw error;
        }
    };

    const saveFiles = async (userId: string) => {
        try {
            const files: Record<string, string> = {};
            const processedPaths = new Set<string>();
            
            // Helper function to recursively read directory
            const readDirRecursive = async (path: string) => {
                const entries = await webContainer?.fs.readdir(path);
                if (!entries) return;

                for (const entry of entries) {
                    const fullPath = `${path}/${entry}`;
                    
                    try {
                        // Try to read as directory first
                        await webContainer?.fs.readdir(fullPath);
                        await readDirRecursive(fullPath);
                    } catch {
                        // If fails, it's a file - read it
                        if (!processedPaths.has(fullPath)) {
                            const content = await webContainer?.fs.readFile(fullPath, 'utf-8');
                            if (content) {
                                // Store relative path by removing /app prefix
                                const relativePath = fullPath.replace('/app/', '');
                                files[relativePath] = content;
                                processedPaths.add(fullPath);
                            }
                        }
                    }
                }
            };

            await readDirRecursive('/app');

            // Batch save to Supabase with compression
            const compressedFiles = Object.entries(files).reduce((acc, [path, content]) => {
                // Skip node_modules, build files, and other large directories
                if (
                    !path.includes('node_modules') && 
                    !path.includes('dist') && 
                    !path.includes('.git')
                ) {
                    acc[path] = content;
                }
                return acc;
            }, {} as Record<string, string>);

            // Save to Supabase with metadata
            const { data, error } = await supabase
                .from('projects')
                .insert([
                    {
                        user_id: userId,
                        files: compressedFiles,
                        created_at: new Date().toISOString(),
                        metadata: {
                            file_count: Object.keys(compressedFiles).length,
                            total_size: JSON.stringify(compressedFiles).length,
                            timestamp: Date.now()
                        }
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return data as Project;

        } catch (error) {
            console.error('Error saving files:', error);
            throw error;
        }
    };

    const loadFiles = async (projectId: string) => {
        try {
            const { data: project, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (error) throw error;
            if (!project) throw new Error('Project not found');

            await initFS();

            // Type assertion to ensure project.files is Record<string, string>
            const files = project.files as Record<string, string>;
            for (const [path, content] of Object.entries(files)) {
                const fullPath = `/app/${path}`;
                await writeFile(fullPath, content);
            }

            return project;
        } catch (error) {
            console.error('Error loading files:', error);
            throw error;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <TerminalTabs
                activeTab={activeTerminal}
                onTabChange={setActiveTerminal}
            />
            <div className="flex-1 relative">
                <div
                    ref={aiTerminalRef}
                    className={`absolute inset-0 bg-[#1a1a1a] transition-opacity duration-200 ${
                        activeTerminal === 'ai' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                />
                <div
                    ref={userTerminalRef}
                    className={`absolute inset-0 bg-black transition-opacity duration-200 ${
                        activeTerminal === 'user' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                />
            </div>
        </div>
    );
}