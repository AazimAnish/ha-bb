'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebContainer, WebContainerProcess } from '@webcontainer/api';
import 'xterm/css/xterm.css';
import { BuildStep } from '../lib/steps';

interface TerminalProps {
    webContainer: WebContainer | null;
    onOutput?: (output: string) => void;
    onStepComplete?: (step: BuildStep) => void;
    onFileChange: (path: string, content: string) => void;
}

export function Terminal({ webContainer, onOutput, onStepComplete, onFileChange }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const shellProcessRef = useRef<WebContainerProcess | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const initRef = useRef<boolean>(false);

    // Initialize terminal
    useEffect(() => {
        if (!terminalRef.current) return;

        const terminal = new XTerm({
            convertEol: true,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            theme: {
                background: '#1a1a1a',
                foreground: '#F14A00',
            },
            cursorBlink: true,
        });

        const fitAddon = new FitAddon();
        fitAddonRef.current = fitAddon;
        terminal.loadAddon(fitAddon);

        requestAnimationFrame(() => {
            if (terminalRef.current) {
                terminal.open(terminalRef.current);
                fitAddon.fit();
            }
        });

        xtermRef.current = terminal;
        terminal.write('\r\n🚀 Starting development environment...\r\n');
        terminal.write('\r\n🔄 Initializing WebContainer environment...\r\n');

        return () => {
            if (shellProcessRef.current) {
                try {
                    shellProcessRef.current.kill();
                } catch (e) {
                    console.error('Error killing process:', e);
                }
            }
            terminal.dispose();
        };
    }, []);

    // Handle window resize
    useEffect(() => {
        function handleResize() {
            fitAddonRef.current?.fit();

            if (shellProcessRef.current && xtermRef.current) {
                shellProcessRef.current.resize({
                    cols: xtermRef.current.cols,
                    rows: xtermRef.current.rows,
                });
            }
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize Next.js project
    useEffect(() => {
        if (!webContainer || !xtermRef.current || initRef.current) return;

        async function initNextJS() {
            const terminal = xtermRef.current!;

            try {
                terminal.write('🚀 Initializing Next.js project...\r\n');

                // Create package.json first
                await webContainer?.fs.writeFile('package.json', JSON.stringify({
                    name: 'next-app',
                    version: '0.1.0',
                    private: true,
                    scripts: {
                        dev: 'next dev',
                        build: 'next build',
                        start: 'next start'
                    },
                    dependencies: {
                        'next': '^14.1.0',
                        'react': '^18.2.0',
                        'react-dom': '^18.2.0'
                    },
                    devDependencies: {
                        '@types/node': '^20',
                        '@types/react': '^18',
                        '@types/react-dom': '^18',
                        'typescript': '^5',
                        'autoprefixer': '^10.0.1',
                        'postcss': '^8',
                        'tailwindcss': '^3.3.0'
                    }
                }, null, 2));

                // Install dependencies with progress tracking
                terminal.write('📦 Installing dependencies...\r\n');
                const installProcess = await webContainer?.spawn('npm', ['install'], {
                    output: true
                });

                if (!installProcess) {
                    throw new Error('Failed to start npm install process');
                }

                await new Promise((resolve, reject) => {
                    installProcess.output.pipeTo(
                        new WritableStream({
                            write(data) {
                                terminal.write(data);
                                onOutput?.(data);
                            },
                            close() {
                                resolve(undefined);
                            }
                        })
                    ).catch(reject);
                });

                // Start dev server
                terminal.write('\r\n🚀 Starting Next.js development server...\r\n');
                const devProcess = await webContainer?.spawn('npm', ['run', 'dev'], {
                    output: true
                });

                if (!devProcess) {
                    throw new Error('Failed to start development server');
                }

                shellProcessRef.current = devProcess;

                // Listen for server ready event
                if (webContainer) {
                    webContainer.on('server-ready', (port, url) => {
                        terminal.write(`\r\n🌎 Server ready at ${url}\r\n`);
                        onStepComplete?.(BuildStep.IMPLEMENT);
                    });
                }

                devProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            terminal.write(data);
                            onOutput?.(data);
                        }
                    })
                );

                initRef.current = true;

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                console.error('Terminal error:', error);
                terminal.write(`\r\n❌ Error: ${errorMessage}\r\n`);
            }
        }

        initNextJS();

        return () => {
            if (shellProcessRef.current) {
                try {
                    shellProcessRef.current.kill();
                } catch (e) {
                    console.error('Error killing process:', e);
                }
            };
        };
    }, [webContainer, onOutput, onStepComplete, onFileChange]);

    return (
        <div className="h-full relative">
            <div
                ref={terminalRef}
                className="absolute inset-0 bg-[#1a1a1a]"
            />
        </div>
    );
}