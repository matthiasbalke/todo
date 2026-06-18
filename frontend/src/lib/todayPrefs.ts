import type { SortDirection, SortField } from '$lib/mock-data';

export type TodayPrefs = {
	sortField: Exclude<SortField, 'MANUAL'>;
	sortDirection: SortDirection;
	starredOnly: boolean;
	hideDone: boolean;
	collapsed: Record<string, boolean>;
	doneCollapsed: Record<string, boolean>;
};

const key = (userId: string) => `todo_today_prefs_${userId}`;

export function loadTodayPrefs(userId: string): TodayPrefs | null {
	try {
		const raw = localStorage.getItem(key(userId));
		return raw ? JSON.parse(raw) as TodayPrefs : null;
	} catch {
		return null;
	}
}

export function saveTodayPrefs(userId: string, prefs: TodayPrefs): void {
	try {
		localStorage.setItem(key(userId), JSON.stringify(prefs));
	} catch {
		// Ignore unavailable local storage.
	}
}
