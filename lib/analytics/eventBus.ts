type AnalyticsEvent = {
    name: string;
    properties?: Record<string, any>;
    timestamp?: number;
};

type AnalyticsProvider = {
    name: string;
    track: (event: AnalyticsEvent) => void;
    identify?: (userId: string, traits?: Record<string, any>) => void;
};

class AnalyticsSystem {
    private providers: AnalyticsProvider[] = [];
    private isInitialized = false;
    private queue: AnalyticsEvent[] = [];

    constructor() {
        this.isInitialized = true;
    }

    registerProvider(provider: AnalyticsProvider) {
        this.providers.push(provider);
        console.log(`[Analytics] Provider registered: ${provider.name}`);
    }

    track(eventName: string, properties?: Record<string, any>) {
        const event: AnalyticsEvent = {
            name: eventName,
            properties,
            timestamp: Date.now(),
        };

        if (!this.isInitialized) {
            this.queue.push(event);
            return;
        }

        this.dispatch(event);
    }

    private dispatch(event: AnalyticsEvent) {
        this.providers.forEach(provider => {
            try {
                provider.track(event);
            } catch (err) {
                console.error(`[Analytics] Error in provider ${provider.name}:`, err);
            }
        });
    }
}

export const analytics = new AnalyticsSystem();

// Phase 40: Future Integration Points
// analytics.registerProvider(new FirebaseAnalyticsProvider());
// analytics.registerProvider(new ProprietaryLooPyckLogger());
