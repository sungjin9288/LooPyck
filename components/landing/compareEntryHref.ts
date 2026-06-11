import type { SearchSort } from '../../types/searchSort';

export function buildCompareEntrySearchHref(query: string, sort: SearchSort = 'sim') {
    const params = new URLSearchParams({ q: query });
    if (sort !== 'sim') {
        params.set('sort', sort);
    }

    return `/?${params.toString()}`;
}
