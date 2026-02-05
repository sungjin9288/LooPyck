export default function ProductSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-full flex flex-col">
            <div className="relative h-64 bg-gray-200 dark:bg-gray-700 animate-pulse" />

            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    {/* Title Area: Matches min-h-[48px] + mb-2 */}
                    <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                    </div>

                    {/* Social Counter Area */}
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/3 mb-2 animate-pulse" />

                    {/* Price Area */}
                    <div className="space-y-1">
                        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                </div>
            </div>
        </div>
    );
}
