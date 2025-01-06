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

export function Terminal({ webContainer, onOutput, onStepComplete }: TerminalProps) {
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

        aiTerminal.write('\r\n🚀 Starting development environment...\r\n');

        aiTerminal.write('\r\n🔄 Initializing WebContainer environment...\r\n');
        console.log('Terminal initialization complete, waiting for WebContainer...');

        return () => {
            console.log('Cleaning up terminal instances');
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

    // Handle terminal focus
    useEffect(() => {
        if (activeTerminal === 'user') {
            userXtermRef.current?.focus();
        } else {
            aiXtermRef.current?.focus();
        }
    }, [activeTerminal]);

    // Initialize shell and project
    useEffect(() => {
        if (!webContainer || !aiXtermRef.current || initRef.current) return;
        initRef.current = true;

        async function startShell() {
            const terminal = aiXtermRef.current!;
            
            try {
                if (!webContainer) return;

                // Start shell first
                const shellProcess = await webContainer.spawn('jsh', {
                    terminal: {
                        cols: terminal.cols,
                        rows: terminal.rows,
                    },
                });
                shellProcessRef.current = shellProcess;

                // Connect streams
                const outputWriter = new WritableStream({
                    write(data) {
                        terminal.write(data);
                        onOutput?.(data);
                    },
                });
                shellProcess.output.pipeTo(outputWriter);

                const input = shellProcess.input.getWriter();
                terminal.onData((data) => input.write(data));

                // Let PreviewFrame handle file creation
                terminal.write('🚀 Starting development environment...\n');
                
                onStepComplete?.(BuildStep.CREATE);
                onStepComplete?.(BuildStep.IMPLEMENT);

            } catch (error) {
                console.error('Terminal error:', error);
                terminal.write(`\r\n❌ Error: ${error}\r\n`);
            }
        }

        startShell();
    }, [webContainer, onOutput, onStepComplete]);

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