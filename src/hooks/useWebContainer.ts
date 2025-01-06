import { useState, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer>();

    useEffect(() => {
        let mounted = true;

        async function initWebContainer() {
            try {
                // Only initialize if no instance exists
                if (!webcontainerInstance && mounted) {
                    webcontainerInstance = await WebContainer.boot();
                    if (mounted) {
                        setWebcontainer(webcontainerInstance);
                    }
                } else if (mounted && webcontainerInstance) {
                    // If instance exists, just set it
                    setWebcontainer(webcontainerInstance);
                }
            } catch (error) {
                console.error('Failed to initialize WebContainer:', error);
            }
        }

        initWebContainer();

        return () => {
            mounted = false;
        };
    }, []); // Remove webcontainer dependency to prevent re-initialization

    return webcontainer;
}