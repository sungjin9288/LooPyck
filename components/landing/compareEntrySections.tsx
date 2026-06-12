import Link from 'next/link';
import type { SearchSort } from '@/types/searchSort';
import CompareShortlistSection from '@/components/product/CompareShortlistSection';
import { buildCompareEntrySearchHref } from './compareEntryHref';
import LandingCompareSearch from './LandingCompareSearch';

// SUN-10 approved Figma direction: dark compare-entry shell with the LooPyck
// accent. Per-route accentColor stays as the ambient glow only.
const ACCENT = '#F4FF3A';

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
    routePath?: string;
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
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F4FF3A]">
                    {eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-50 sm:text-3xl">
                    {title}
                </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
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
    routePath?: string;
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
    routePath,
    quickRoutes,
    decisionSignals,
    searchHeading,
    searchDescription,
    starterQuery,
}: CompareEntryHeroSectionProps) {
    return (
        <section className="relative overflow-hidden border-b border-[#243447] bg-[#0D1117]">
            <div
                className="absolute -right-20 top-0 h-72 w-72 rounded-full blur-3xl"
                style={{ backgroundColor: accentColor, opacity: 0.16 }}
            />
            <div
                className="absolute left-0 top-24 h-56 w-56 rounded-full blur-3xl"
                style={{ backgroundColor: ACCENT, opacity: 0.06 }}
            />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
                <div className="flex flex-wrap items-center gap-3">
                    <nav className="flex items-center gap-2 text-sm text-slate-500">
                        <Link href="/" className="transition-colors hover:text-slate-200">
                            홈
                        </Link>
                        <span>/</span>
                        <span className="font-medium text-slate-200">{breadcrumbLabel}</span>
                    </nav>
                    {routePath && (
                        <span className="rounded-full border border-[#334155] bg-[#182235] px-3 py-1 text-[11px] font-semibold text-slate-300">
                            ROUTE {routePath}
                        </span>
                    )}
                </div>

                <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F4FF3A]">
                            {eyebrow}
                        </p>
                        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
                            {title}
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
                            {description}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {quickRoutes.slice(0, 4).map((route, index) => (
                                <Link
                                    key={route.query}
                                    href={buildCompareEntrySearchHref(route.query, route.sort)}
                                    className={
                                        index === 0
                                            ? 'rounded-full border border-[#F4FF3A] bg-[#F4FF3A] px-4 py-2 text-sm font-bold text-[#0D1117] transition-opacity hover:opacity-90'
                                            : 'rounded-full border border-[#334155] bg-[#182235] px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:text-white'
                                    }
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F4FF3A]">
                            Compare Lens
                        </p>
                        {decisionSignals.map((signal) => (
                            <div
                                key={signal.label}
                                className="rounded-2xl border border-[#243447] bg-[#111827] p-4"
                            >
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                    {signal.label}
                                </p>
                                <p className="mt-2 text-sm font-semibold leading-6 text-slate-100 sm:text-base">
                                    {signal.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-10 rounded-[1.5rem] border border-[#243447] bg-[#111827] p-5 sm:p-7">
                    <div className="max-w-3xl">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F4FF3A]">
                            Search Compare Entry
                        </p>
                        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-50 sm:text-3xl">
                            {searchHeading}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
                            {searchDescription}
                        </p>
                    </div>

                    <div className="mt-6">
                        <LandingCompareSearch initialQuery={starterQuery} />
                    </div>
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
}: CompareRoutesSectionProps) {
    return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <CompareEntrySectionHeader
                eyebrow="Quick Routes"
                title={routesHeading}
                description={routesDescription}
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {quickRoutes.map((route) => (
                    <Link
                        key={`${route.label}:${route.query}`}
                        href={buildCompareEntrySearchHref(route.query, route.sort)}
                        className="group rounded-2xl border border-[#243447] bg-[#111827] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-slate-500"
                    >
                        <span className="inline-flex rounded-full border border-[#334155] bg-[#182235] px-3 py-1 text-xs font-semibold text-slate-200">
                            {route.label}
                        </span>
                        <p className="mt-4 text-sm leading-6 text-slate-400">
                            {route.note}
                        </p>
                        <p className="mt-4 text-sm font-bold text-[#F4FF3A]">
                            바로 비교하기 →
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

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {proofPoints.map((point) => (
                    <article
                        key={point.title}
                        className="rounded-2xl border border-[#243447] bg-[#111827] p-5"
                    >
                        <h3 className="text-lg font-black tracking-tight text-slate-50">
                            {point.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-400">
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
        <section className="border-t border-[#243447] bg-[#0B1220]">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <CompareEntrySectionHeader
                    eyebrow="Sibling Navigation"
                    title={siblingHeading}
                    description={siblingDescription}
                />

                <div className="mt-6 flex flex-wrap gap-3">
                    {siblingLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            title={link.note}
                            className="rounded-full border border-[#334155] bg-[#182235] px-5 py-2.5 text-sm font-bold text-slate-100 transition-colors hover:border-[#F4FF3A] hover:text-[#F4FF3A]"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
