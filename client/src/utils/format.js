/**
 * Formats a number into a compact, human-readable string.
 * e.g., 3400 -> 3.4K, 1200000 -> 1.2M
 * @param {number} num - The number to format.
 * @returns {string} The formatted number string.
 */
export function formatNumber(num) {
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
export function timeAgo(seconds) {
    if (seconds === undefined)
        return '';
    if (seconds < 2)
        return 'Just Now';
    if (seconds < 60)
        return `${seconds} Seconds Ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes} Minute${minutes > 1 ? 's' : ''} Ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours} Hour${hours > 1 ? 's' : ''} Ago`;
    const days = Math.floor(hours / 24);
    if (days < 30)
        return `${days} Day${days > 1 ? 's' : ''} Ago`;
    const months = Math.floor(days / 30);
    if (months < 12)
        return `${months} Month${months > 1 ? 's' : ''} Ago`;
    const years = Math.floor(days / 365);
    return `${years} Year${years > 1 ? 's' : ''} Ago`;
}
