import { WebContainer } from '@webcontainer/api';
import { useState, useEffect } from 'react';

// Global instance to ensure single WebContainer
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

interface WebContainerHookResult {
  webcontainer: WebContainer | null;
  error: Error | null;
  isBooting: boolean;
}

export function useWebContainer(): WebContainerHookResult {
    const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isBooting, setIsBooting] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function bootWebContainer() {
            if (!isMounted) return;
            
            try {
                setIsBooting(true);
                
                // If already booted, return existing instance
                if (webcontainerInstance) {
                    setWebcontainer(webcontainerInstance);
                    return;
                }

                // If boot in progress, wait for it
                if (bootPromise) {
                    const instance = await bootPromise;
                    if (!isMounted) return;
                    setWebcontainer(instance);
                    return;
                }

                // Start new boot process
                bootPromise = WebContainer.boot({
                    workdirName: 'ha-bb-workspace',
                    forwardPreviewErrors: true
                });
                
                webcontainerInstance = await bootPromise;
                if (!isMounted) {
                    // If unmounted during boot, cleanup
                    webcontainerInstance.teardown();
                    webcontainerInstance = null;
                    bootPromise = null;
                    return;
                }
                
                setWebcontainer(webcontainerInstance);
            } catch (err) {
                if (!isMounted) return;
                console.error('Failed to boot WebContainer:', err);
                setError(err instanceof Error ? err : new Error(String(err)));
                // Reset promises/instances on error
                bootPromise = null;
                webcontainerInstance = null;
            } finally {
                if (isMounted) {
                    setIsBooting(false);
                }
            }
        }

        bootWebContainer();

        return () => {
            isMounted = false;
            // Don't teardown the global instance on unmount
            // It will be reused by other components
        };
    }, []);

    return { webcontainer, error, isBooting };
}