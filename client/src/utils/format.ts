/**
 * Formats a number into a compact, human-readable string.
 * e.g., 3400 -> 3.4K, 1200000 -> 1.2M
 * @param {number} num - The number to format.
 * @returns {string} The formatted number string.
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

/**
 * Converts an ISO 8601 date string into a relative time string.
 * e.g., "2023-10-27T10:00:00Z" -> "45 minutes ago"
 * @param {string} dateString - The ISO date string.
 * @returns {string} The relative time string.
 */
export function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    const pluralize = (value: number, unit: string) => {
        return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
    };

    if (seconds < 60) return pluralize(seconds, 'second');

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return pluralize(minutes, 'minute');

    const hours = Math.round(minutes / 60);
    if (hours < 24) return pluralize(hours, 'hour');

    const days = Math.round(hours / 24);
    if (days < 7) return pluralize(days, 'day');

    const weeks = Math.round(days / 7);
    if (weeks < 4) return pluralize(weeks, 'week');

    const months = Math.round(days / 30);
    if (months < 12) return pluralize(months, 'month');

    const years = Math.round(days / 365);
    return pluralize(years, 'year');
}