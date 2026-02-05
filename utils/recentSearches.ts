const RECENT_SEARCHES_KEY = 'fashion-recent-searches';

export function getRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(RECENT_SEARCHES_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function addRecentSearch(query: string): void {
    let searches = getRecentSearches();
    searches = searches.filter((item) => item !== query);
    searches.unshift(query);
    searches = searches.slice(0, 10); // Max 10 items
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

export function clearRecentSearches(): void {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
}
