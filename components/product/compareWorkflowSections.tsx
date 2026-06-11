import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface CompareWorkflowSectionHeaderProps {
    title: string;
    description: string;
    badgeLabel?: string;
}

interface CompareHighlightCardProps {
    animationIndex: number;
    image: string;
    title: string;
    mallCount: number;
    confidence: number;
    spread: number;
    verifiedCount: number;
    totalVariantCount: number;
    retailerTrustLabel: string;
    matchStrategyLabel: string;
    optionSummary?: string;
    variantCandidateCount: number;
    lowestCheckoutPrice: number;
    lowestCheckoutMallName: string;
    lowestBestCasePrice?: number;
    checkoutEvidenceLabel?: string;
    checkoutEvidenceDetails?: string;
    bestCaseEvidenceLabel?: string;
    bestCaseMallName?: string;
    onClick: () => void;
}

interface CompareShortlistSectionHeaderProps {
    count: number;
    onClear: () => void;
}

interface CompareShortlistItemCardProps {
    image: string;
    title: string;
    mallName: string;
    source?: string;
    variantLabel?: string;
    priceLabel: string;
    href: string;
    internalHref: boolean;
    externalHref: boolean;
    onRemove: () => void;
}

interface CompareShortlistActionButtonProps {
    shortlisted: boolean;
    compact?: boolean;
    className?: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function CompareWorkflowSectionHeader({
    title,
    description,
    badgeLabel,
}: CompareWorkflowSectionHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-4 mb-5">
            <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    {title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    {description}
                </p>
            </div>
            {badgeLabel ? (
                <span className="hidden sm:inline-flex rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
                    {badgeLabel}
                </span>
            ) : null}
        </div>
    );
}

export function CompareHighlightCard({
    animationIndex,
    image,
    title,
    mallCount,
    confidence,
    spread,
    verifiedCount,
    totalVariantCount,
    retailerTrustLabel,
    matchStrategyLabel,
    optionSummary,
    variantCandidateCount,
    lowestCheckoutPrice,
    lowestCheckoutMallName,
    lowestBestCasePrice,
    checkoutEvidenceLabel,
    checkoutEvidenceDetails,
    bestCaseEvidenceLabel,
    bestCaseMallName,
    onClick,
}: CompareHighlightCardProps) {
    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: animationIndex * 0.08 }}
            onClick={onClick}
            className="text-left rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all overflow-hidden"
        >
            <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
            </div>
            <div className="p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {mallCount}개 쇼핑몰 비교
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-sky-50 text-sky-700 px-2.5 py-1 text-[11px] font-bold">
                            매칭 {confidence}%
                        </span>
                        <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-bold">
                            최대 {spread.toLocaleString()}원 차이
                        </span>
                        {verifiedCount > 0 && (
                            <span className="rounded-full bg-violet-50 text-violet-700 px-2.5 py-1 text-[11px] font-bold">
                                PDP {verifiedCount}/{totalVariantCount}
                            </span>
                        )}
                    </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 line-clamp-2 mb-3">
                    {title}
                </h3>
                <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {lowestCheckoutMallName} · {retailerTrustLabel}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {matchStrategyLabel}
                    </span>
                </div>
                {optionSummary ? (
                    <p className="mb-3 text-xs text-slate-500 line-clamp-2">
                        {optionSummary}
                    </p>
                ) : null}
                {variantCandidateCount > 0 ? (
                    <p className="mb-3 text-xs text-slate-500 line-clamp-2">
                        선택 가능 variant {variantCandidateCount}개
                    </p>
                ) : null}
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <p className="text-xs text-slate-500">배송 반영 결제가 기준 최저</p>
                        <p className="text-2xl font-black tracking-tight text-slate-900">
                            {lowestCheckoutPrice.toLocaleString()}원
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400">
                            {lowestCheckoutMallName}
                        </p>
                        {typeof lowestBestCasePrice === 'number' ? (
                            <p className="text-sm font-semibold text-slate-600">
                                혜택 적용시 최저 {lowestBestCasePrice.toLocaleString()}원
                            </p>
                        ) : null}
                    </div>
                </div>
                {checkoutEvidenceLabel ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                            실구매가 근거
                        </p>
                        <p className="mt-2 text-xs font-semibold text-slate-700">
                            결제가 기준 {lowestCheckoutMallName} · {checkoutEvidenceLabel}
                        </p>
                        {checkoutEvidenceDetails ? (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                                {checkoutEvidenceDetails}
                            </p>
                        ) : null}
                        {bestCaseEvidenceLabel && bestCaseMallName ? (
                            <p className="mt-2 text-xs text-rose-700 line-clamp-2">
                                혜택 최저 {bestCaseMallName} · {bestCaseEvidenceLabel}
                            </p>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </motion.button>
    );
}

export function CompareShortlistSectionHeader({
    count,
    onClear,
}: CompareShortlistSectionHeaderProps) {
    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Guest Compare Shortlist</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">로그인 없이 저장한 비교 후보</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    나중에 다시 볼 상품만 먼저 담아두고, 준비가 되면 각 compare page로 바로 이어서 확인할 수 있습니다.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                    {count}개 저장됨
                </span>
                <button
                    type="button"
                    onClick={onClear}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                    전체 비우기
                </button>
            </div>
        </div>
    );
}

export function CompareShortlistItemCard({
    image,
    title,
    mallName,
    source,
    variantLabel,
    priceLabel,
    href,
    internalHref,
    externalHref,
    onRemove,
}: CompareShortlistItemCardProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex gap-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="80px"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        {mallName}
                        {source ? ` · ${source}` : ''}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-slate-950">
                        {title}
                    </h3>
                    {variantLabel ? (
                        <p className="mt-2 text-xs font-semibold text-fuchsia-700">
                            {variantLabel}
                        </p>
                    ) : null}
                    <p className="mt-2 text-sm font-bold text-slate-900">
                        {priceLabel}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {internalHref ? (
                    <Link
                        href={href}
                        className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                    >
                        비교 이어보기
                    </Link>
                ) : (
                    <a
                        href={href}
                        target={externalHref ? '_blank' : undefined}
                        rel={externalHref ? 'noopener noreferrer' : undefined}
                        className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                    >
                        상품 열기
                    </a>
                )}
                <button
                    type="button"
                    onClick={onRemove}
                    className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                    제거
                </button>
            </div>
        </div>
    );
}

export function CompareShortlistActionButton({
    shortlisted,
    compact = false,
    className = '',
    onClick,
}: CompareShortlistActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                shortlisted
                    ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
            } ${compact ? 'px-3 py-1.5 text-xs' : ''} ${className}`}
            aria-label={shortlisted ? '비교 후보 제거' : '비교 후보 저장'}
        >
            {shortlisted ? '후보 저장됨' : '비교 후보'}
        </button>
    );
}
