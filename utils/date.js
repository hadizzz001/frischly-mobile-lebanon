// Date helpers that avoid timezone off-by-one errors.
//
// A "date of birth" (or any pure calendar date) must be handled using LOCAL
// date parts. Using Date.prototype.toISOString() converts to UTC, which in
// timezones ahead of UTC (e.g. Lebanon, UTC+2/+3) shifts a local-midnight date
// to the previous day. These helpers keep the calendar day the user picked.

/**
 * Format a Date as a local "YYYY-MM-DD" string (no timezone shift).
 * @param {Date} date
 * @returns {string}
 */
export const formatLocalDate = (date) => {
	if (!date) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

/**
 * Convert a picked calendar date into an ISO string that is safe to send to the
 * backend without losing a day. We anchor the time at 12:00 UTC so that no
 * timezone offset can push the date across a day boundary.
 * @param {Date} date
 * @returns {string}
 */
export const toCalendarISOString = (date) => {
	if (!date) return "";
	return new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
	).toISOString();
};

export default { formatLocalDate, toCalendarISOString };
