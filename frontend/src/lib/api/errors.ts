import { ApiError } from './client';

const STATUS_MESSAGES: Partial<Record<number, string>> = {
	403: "You don't have permission to do this.",
	429: 'Too many requests — please wait a moment.',
	500: 'Something went wrong — please try again.',
	502: 'The server is unavailable — please try again.',
	503: 'The server is unavailable — please try again.',
};

export function friendlyError(error: unknown, fallback: string): string {
	console.error(error);
	if (error instanceof TypeError && !navigator.onLine) {
		return "You're offline — please check your connection.";
	}
	if (error instanceof ApiError) {
		return STATUS_MESSAGES[error.status] ?? fallback;
	}
	return fallback;
}
