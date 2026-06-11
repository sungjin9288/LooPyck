'use client';

import { useEffect, useState } from 'react';
import { Logger } from '@/lib/core/observability';

type TdsMobileModule = typeof import('@toss/tds-mobile');

export function useTdsMobile(enabled: boolean) {
    const [module, setModule] = useState<TdsMobileModule | null>(null);

    useEffect(() => {
        if (!enabled) {
            setModule(null);
            return;
        }

        let active = true;

        import('@toss/tds-mobile')
            .then((loadedModule) => {
                if (!active) return;
                setModule(loadedModule);
            })
            .catch((error: unknown) => {
                if (!active) return;
                setModule(null);
                Logger.warn('Failed to load @toss/tds-mobile', {
                    error: error instanceof Error ? error.message : String(error ?? ''),
                });
            });

        return () => {
            active = false;
        };
    }, [enabled]);

    return module;
}
