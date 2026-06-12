'use client';

import { useRouter } from 'next/navigation';
import SearchBar from '@/components/search/SearchBar';
import type { SearchSort } from '@/types/searchSort';
import { buildCompareEntrySearchHref } from './compareEntryHref';

interface LandingCompareSearchProps {
    initialQuery: string;
    initialSort?: SearchSort;
}

export default function LandingCompareSearch({
    initialQuery,
    initialSort = 'sim',
}: LandingCompareSearchProps) {
    const router = useRouter();

    const handleSearch = (query: string, sort: SearchSort) => {
        router.push(buildCompareEntrySearchHref(query, sort));
    };

    return (
        <SearchBar
            query={initialQuery}
            sort={initialSort}
            onSearch={handleSearch}
            tone="dark"
        />
    );
}
