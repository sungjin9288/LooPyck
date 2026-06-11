type DashboardLoadingScreenProps = {
    className?: string;
};

export function DashboardLoadingScreen({
    className = 'min-h-screen bg-slate-950 text-slate-200 p-8',
}: DashboardLoadingScreenProps) {
    return <div className={className}>Loading...</div>;
}

type DashboardAccessStateProps = {
    title: string;
    description: string;
};

export function DashboardAccessState({
    title,
    description,
}: DashboardAccessStateProps) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-8">
            <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Only</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white">{title}</h1>
                <p className="mt-3 text-sm text-slate-400">{description}</p>
            </div>
        </div>
    );
}
