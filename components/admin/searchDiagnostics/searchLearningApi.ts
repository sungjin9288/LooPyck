'use client';

import type { User } from 'firebase/auth';
import type { SearchLearningActivityEvent, SearchLearningEntry } from './types';

type SearchLearningMutationMethod = 'POST' | 'PATCH';

export type SearchLearningMutationResponse = {
    entry?: SearchLearningEntry | null;
    entries?: SearchLearningEntry[];
    activity?: SearchLearningActivityEvent | null;
    error?: string;
};

type RequestSearchLearningMutationParams = {
    user: User;
    method: SearchLearningMutationMethod;
    body: Record<string, unknown>;
    fallbackErrorMessage: string;
};

export async function requestSearchLearningMutation({
    user,
    method,
    body,
    fallbackErrorMessage,
}: RequestSearchLearningMutationParams): Promise<SearchLearningMutationResponse> {
    const token = await user.getIdToken();
    const response = await fetch('/api/search-learning', {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const payload = await response.json() as SearchLearningMutationResponse;
    if (!response.ok) {
        throw new Error(payload.error || fallbackErrorMessage);
    }

    return payload;
}
