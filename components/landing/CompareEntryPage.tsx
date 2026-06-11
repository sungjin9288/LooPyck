import {
    CompareEntryHeroSection,
    type CompareEntryHeroContent,
    CompareProofSection,
    type CompareEntryProofContent,
    CompareRoutesSection,
    type CompareEntryRoutesContent,
    CompareShortlistReentrySection,
    CompareSiblingSection,
    type CompareEntrySiblingContent,
} from './compareEntrySections';

interface CompareEntryPageProps {
    hero: CompareEntryHeroContent;
    routes: CompareEntryRoutesContent;
    proof: CompareEntryProofContent;
    siblings: CompareEntrySiblingContent;
}

export default function CompareEntryPage({
    hero,
    routes,
    proof,
    siblings,
}: CompareEntryPageProps) {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <CompareEntryHeroSection
                {...hero}
                quickRoutes={routes.quickRoutes}
            />
            <CompareRoutesSection
                {...routes}
            />
            <CompareShortlistReentrySection />
            <CompareProofSection
                {...proof}
            />
            <CompareSiblingSection
                {...siblings}
            />
        </main>
    );
}
