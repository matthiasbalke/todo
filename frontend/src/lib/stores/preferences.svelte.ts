import { getMe, updatePreferences, type UserProfileDto } from '$lib/api/users';

let profile = $state<UserProfileDto | null>(null);
let loading = $state(false);

export function getProfile(): UserProfileDto | null {
	return profile;
}

export function isPreferencesLoading(): boolean {
	return loading;
}

export async function loadPreferences(fetchFn: typeof fetch = fetch): Promise<UserProfileDto> {
	loading = true;
	try {
		profile = await getMe(fetchFn);
		if (!profile.timeZoneInitialized) {
			let detected = 'UTC';
			try {
				detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
			} catch {
				// Keep UTC when browser timezone detection is unavailable.
			}
			profile = await updatePreferences({
				timeZone: detected,
				todayViewEnabled: profile.todayViewEnabled,
			});
		}
		return profile;
	} finally {
		loading = false;
	}
}

export async function savePreferences(timeZone: string, todayViewEnabled: boolean): Promise<UserProfileDto> {
	profile = await updatePreferences({ timeZone, todayViewEnabled });
	return profile;
}

export function setProfile(value: UserProfileDto): void {
	profile = value;
}
