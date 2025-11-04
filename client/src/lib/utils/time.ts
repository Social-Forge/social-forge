import {
	format,
	formatDistance,
	formatRelative,
	differenceInDays,
	differenceInHours,
	differenceInMinutes,
	parseISO,
	isBefore,
	isAfter,
	addDays,
	addHours,
	addMinutes,
	isEqual,
	isValid
} from 'date-fns';
import { enUS } from 'date-fns/locale';

export const POSTGRES_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSS xxxx';

/**
 * Parse PostgreSQL timestamp string to Date object
 */
export function parsePostgresDate(dateString: string): Date {
	try {
		// Handle various PostgreSQL timestamp formats
		const cleanedDate = dateString.replace(' +0700', '').replace(' +07', '');
		const parsed = parseISO(cleanedDate);

		if (!isValid(parsed)) {
			throw new Error(`Invalid date string: ${dateString}`);
		}

		return parsed;
	} catch (error) {
		console.error('Error parsing PostgreSQL date:', error);
		throw new Error(`Failed to parse date: ${dateString}`);
	}
}
/**
 * Check if a date string is expired
 */
export function isExpired(dateString: string): boolean {
	const targetDate = parsePostgresDate(dateString);
	const now = new Date();
	return isBefore(targetDate, now);
}
/**
 * Check if a date string will expire within a specified number of days
 */
export function willExpireInDays(dateString: string, days: number = 5): boolean {
	const targetDate = parsePostgresDate(dateString);
	const now = new Date();
	const daysUntilExpiry = differenceInDays(targetDate, now);

	return daysUntilExpiry <= days && daysUntilExpiry >= 0;
}
/**
 * Get detailed time remaining until expiration
 */
export function getTimeRemaining(dateString: string): TimeRemaining {
	const targetDate = parsePostgresDate(dateString);
	const now = new Date();

	const totalMilliseconds = targetDate.getTime() - now.getTime();
	const isExpired = totalMilliseconds <= 0;

	if (isExpired) {
		return {
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
			totalMilliseconds: 0,
			isExpired: true
		};
	}

	const days = Math.floor(totalMilliseconds / (1000 * 60 * 60 * 24));
	const hours = Math.floor((totalMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((totalMilliseconds % (1000 * 60)) / 1000);

	return {
		days,
		hours,
		minutes,
		seconds,
		totalMilliseconds,
		isExpired: false
	};
}
/**
 * Format a date string using date-fns format
 */
export function formatDate(dateString: string, formatString: string = 'PPpp'): string {
	const date = parsePostgresDate(dateString);
	return format(date, formatString, { locale: enUS });
}
/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
	const date = parsePostgresDate(dateString);
	const now = new Date();

	return formatDistance(date, now, {
		addSuffix: true,
		locale: enUS
	});
}
/**
 * Get time until expiry string (e.g., "2 days 3 hours")
 */
export function getTimeUntilExpiry(dateString: string): string {
	const timeRemaining = getTimeRemaining(dateString);

	if (timeRemaining.isExpired) {
		return 'Expired';
	}

	if (timeRemaining.days > 0) {
		return `${timeRemaining.days} Day ${timeRemaining.hours} Hour`;
	} else if (timeRemaining.hours > 0) {
		return `${timeRemaining.hours} Hour ${timeRemaining.minutes} Minute`;
	} else {
		return `${timeRemaining.minutes} Minute ${timeRemaining.seconds} Second`;
	}
}
/**
 * Check if a date string is within a specified date range
 */
export function isWithinRange(dateString: string, startDate: Date, endDate: Date): boolean {
	const date = parsePostgresDate(dateString);
	return (
		(isAfter(date, startDate) || isEqual(date, startDate)) &&
		(isBefore(date, endDate) || isEqual(date, endDate))
	);
}
/**
 * Add days to a date string
 */
export function AddDays(dateString: string, days: number): Date {
	const date = parsePostgresDate(dateString);
	return addDays(date, days);
}
/**
 * Get the number of days between two date strings
 */
export function getDaysDifference(fromDateString: string, toDateString: string): number {
	const fromDate = parsePostgresDate(fromDateString);
	const toDate = parsePostgresDate(toDateString);

	return differenceInDays(toDate, fromDate);
}
/**
 * Check if a date string is today
 */
export function isToday(dateString: string): boolean {
	const date = parsePostgresDate(dateString);
	const today = new Date();

	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	);
}
/**
 * Check if a date string is in the future
 */
export function isFuture(dateString: string): boolean {
	const date = parsePostgresDate(dateString);
	return isAfter(date, new Date());
}
/**
 * Check if a date string is in the past
 */
export function isPast(dateString: string): boolean {
	return isExpired(dateString);
}
/**
 * Get the start of the day for a given date string
 */
export function getStartOfDay(dateString: string): Date {
	const date = parsePostgresDate(dateString);
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
/**
 * Get the end of the day for a given date string
 */
export function getEndOfDay(dateString: string): Date {
	const date = parsePostgresDate(dateString);
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
