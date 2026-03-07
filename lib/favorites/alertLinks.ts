export function buildAlertDetailHref(alertId: string): string {
    return `/favorites/alerts/${encodeURIComponent(alertId)}`;
}
