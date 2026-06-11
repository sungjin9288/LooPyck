import {
    mergeSearchLearningActivityEvents,
    mergeSearchLearningEntries,
    summarizeSearchLearningEntries,
} from './helpers';
import type {
    DiagnosticsResponse,
    SearchLearningActivityEvent,
    SearchLearningEntry,
} from './types';

export function updateSearchLearningDataState(
    current: DiagnosticsResponse | null,
    updatedEntries: SearchLearningEntry[],
    activity?: SearchLearningActivityEvent | null
) {
    if (!current) {
        return current;
    }

    const entries = mergeSearchLearningEntries(current.searchLearning.entries, updatedEntries);
    return {
        ...current,
        searchLearning: {
            ...current.searchLearning,
            entries,
            summary: summarizeSearchLearningEntries(entries),
        },
        searchLearningActivity: {
            ...current.searchLearningActivity,
            events: activity
                ? mergeSearchLearningActivityEvents(current.searchLearningActivity.events, [activity])
                : current.searchLearningActivity.events,
        },
    };
}

export function updateSingleSearchLearningEntryState(
    current: DiagnosticsResponse | null,
    entryId: string,
    nextEntry: SearchLearningEntry | null,
    activity?: SearchLearningActivityEvent | null
) {
    if (!current) {
        return current;
    }

    const entries = current.searchLearning.entries.map((entry) => (
        entry.id === entryId ? (nextEntry || entry) : entry
    ));

    return {
        ...current,
        searchLearning: {
            ...current.searchLearning,
            entries,
            summary: summarizeSearchLearningEntries(entries),
        },
        searchLearningActivity: {
            ...current.searchLearningActivity,
            events: activity
                ? mergeSearchLearningActivityEvents(current.searchLearningActivity.events, [activity])
                : current.searchLearningActivity.events,
        },
    };
}

