import Link from 'next/link';
import type { SearchSort } from '@/types/searchSort';
import CompareShortlistSection from '@/components/product/CompareShortlistSection';
import { buildCompareEntrySearchHref } from './compareEntryHref';
import LandingCompareSearch from './LandingCompareSearch';

export interface CompareEntryRoute {
    label: string;
    query: string;
    note: string;
    sort?: SearchSort;
}

export interface CompareEntrySignal {
    label: string;
    value: string;
}

export interface CompareEntryProof {
    title: string;
    description: string;
}

export interface CompareEntrySiblingLink {
    href: string;
    label: string;
    note: string;
}

export interface CompareEntryHeroContent {
    breadcrumbLabel: string;
    eyebrow: string;
    title: string;
    description: string;
    accentColor: string;
    decisionSignals: CompareEntrySignal[];
    searchHeading: string;
    searchDescription: string;
    starterQuery: string;
}

export interface CompareEntryRoutesContent {
    routesHeading: string;
    routesDescription: string;
    quickRoutes: CompareEntryRoute[];
    accentColor: string;
}

export interface CompareEntryProofContent {
    accentColor: string;
    proofHeading: string;
    proofDescription: string;
    proofPoints: CompareEntryProof[];
}

export interface CompareEntrySiblingContent {
    siblingHeading: string;
    siblingDescription: string;
    siblingLinks: CompareEntrySiblingLink[];
}

interface CompareEntrySectionHeaderProps {
    eyebrow: string;
    title: string;
    description: string;
}

function CompareEntrySectionHeader({
    eyebrow,
    title,
    description,
}: CompareEntrySectionHeaderProps) {
    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                    {eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {title}
                </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {description}
            </p>
        </div>
    );
}

interface CompareEntryHeroSectionProps {
    breadcrumbLabel: string;
    eyebrow: string;
    title: string;
    description: string;
    accentColor: string;
    quickRoutes: CompareEntryRoute[];
    decisionSignals: CompareEntrySignal[];
    searchHeading: string;
    searchDescription: string;
    starterQuery: string;
}

export function CompareEntryHeroSection({
    breadcrumbLabel,
    eyebrow,
    title,
    description,
    accentColor,
    quickRoutes,
    decisionSignals,
    searchHeading,
    searchDescription,
    starterQuery,
}: CompareEntryHeroSectionProps) {
    return (
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
            <div
                className="absolute -right-20 top-0 h-72 w-72 rounded-full blur-3xl"
                style={{ backgroundColor: accentColor, opacity: 0.14 }}
            />
            <div
                className="absolute left-0 top-24 h-56 w-56 rounded-full blur-3xl"
                style={{ backgroundColor: accentColor, opacity: 0.08 }}
            />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
                <nav className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/" className="transition-colors hover:text-slate-900">
                        홈
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-slate-900">{breadcrumbLabel}</span>
                </nav>

                <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-end">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                            {eyebrow}
                        </p>
                        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                            {title}
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                            {description}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {quickRoutes.slice(0, 4).map((route) => (
                                <Link
                                    key={route.query}
                                    href={buildCompareEntrySearchHref(route.query, route.sort)}
                                    className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-950"
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                            Compare Lens
                        </p>
                        <div className="mt-4 divide-y divide-slate-200">
                            {decisionSignals.map((signal) => (
                                <div key={signal.label} className="py-4 first:pt-0 last:pb-0">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                        {signal.label}
                                    </p>
                                    <p className="mt-2 text-base font-semibold leading-7 text-slate-900">
                                        {signal.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-10 border-t border-slate-200 pt-8">
                    <div className="max-w-3xl">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                            Search Compare Entry
                        </p>
                        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                            {searchHeading}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                            {searchDescription}
                        </p>
                    </div>

                    <LandingCompareSearch initialQuery={starterQuery} />
                </div>
            </div>
        </section>
    );
}

interface CompareRoutesSectionProps {
    routesHeading: string;
    routesDescription: string;
    quickRoutes: CompareEntryRoute[];
    accentColor: string;
}

export function CompareRoutesSection({
    routesHeading,
    routesDescription,
    quickRoutes,
    accentColor,
}: CompareRoutesSectionProps) {
    return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <CompareEntrySectionHeader
                eyebrow="Compare Routes"
                title={routesHeading}
                description={routesDescription}
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {quickRoutes.map((route) => (
                    <Link
                        key={`${route.label}:${route.query}`}
                        href={buildCompareEntrySearchHref(route.query, route.sort)}
                        className="group rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                        <div
                            className="h-1 w-16 rounded-full"
                            style={{ backgroundColor: accentColor }}
                        />
                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                            {route.note}
                        </p>
                        <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
                            {route.label}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            {route.query}
                        </p>
                        <p className="mt-4 text-sm font-semibold text-slate-900">
                            바로 비교하기
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export function CompareShortlistReentrySection() {
    return (
        <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
            <CompareShortlistSection />
        </div>
    );
}

interface CompareProofSectionProps {
    accentColor: string;
    proofHeading: string;
    proofDescription: string;
    proofPoints: CompareEntryProof[];
}

export function CompareProofSection({
    accentColor,
    proofHeading,
    proofDescription,
    proofPoints,
}: CompareProofSectionProps) {
    return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <CompareEntrySectionHeader
                eyebrow="Compare Proof"
                title={proofHeading}
                description={proofDescription}
            />

            <div className="mt-6 grid gap-8 lg:grid-cols-3">
                {proofPoints.map((point) => (
                    <article
                        key={point.title}
                        className="border-t pt-5"
                        style={{ borderColor: accentColor }}
                    >
                        <h3 className="text-xl font-black tracking-tight text-slate-950">
                            {point.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                            {point.description}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}

interface CompareSiblingSectionProps {
    siblingHeading: string;
    siblingDescription: string;
    siblingLinks: CompareEntrySiblingLink[];
}

export function CompareSiblingSection({
    siblingHeading,
    siblingDescription,
    siblingLinks,
}: CompareSiblingSectionProps) {
    return (
        <section className="border-t border-slate-200 bg-white/70">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <CompareEntrySectionHeader
                    eyebrow="Next Entry"
                    title={siblingHeading}
                    description={siblingDescription}
                />

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {siblingLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
                        >
                            <h3 className="text-base font-black text-slate-950">
                                {link.label}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {link.note}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
