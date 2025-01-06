import { WebContainer } from '@webcontainer/api';
import { useState, useEffect } from 'react';

// Global instance to ensure single WebContainer
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function bootWebContainer() {
            try {
                // If already booted, return existing instance
                if (webcontainerInstance) {
                    setWebcontainer(webcontainerInstance);
                    return;
                }

                // If boot in progress, wait for it
                if (bootPromise) {
                    const instance = await bootPromise;
                    setWebcontainer(instance);
                    return;
                }

                // Start new boot process
                bootPromise = WebContainer.boot();
                webcontainerInstance = await bootPromise;
                setWebcontainer(webcontainerInstance);
            } catch (error) {
                console.error('Failed to boot WebContainer:', error);
                setError(error as Error);
                // Reset promises/instances on error
                bootPromise = null;
                webcontainerInstance = null;
            }
        }

        bootWebContainer();

        return () => {
            // Cleanup if component unmounts
            // Note: We don't cleanup webcontainerInstance here as it should persist
        };
    }, []);

    return { webcontainer, error };
}