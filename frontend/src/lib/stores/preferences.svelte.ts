import { getMe, updatePreferences, type UserProfileDto } from '$lib/api/users';
import { normalizeThemePreference, setThemePreference } from './theme.svelte';

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
		profile = { ...profile, themePreference: normalizeThemePreference(profile.themePreference) };
		setThemePreference(profile.themePreference);
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
				themePreference: profile.themePreference,
			});
			profile = { ...profile, themePreference: normalizeThemePreference(profile.themePreference) };
			setThemePreference(profile.themePreference);
		}
		return profile;
	} finally {
		loading = false;
	}
}

export async function savePreferences(
	timeZone: string,
	todayViewEnabled: boolean,
	themePreference = profile?.themePreference ?? 'SYSTEM',
): Promise<UserProfileDto> {
	profile = await updatePreferences({ timeZone, todayViewEnabled, themePreference });
	profile = { ...profile, themePreference: normalizeThemePreference(profile.themePreference) };
	setThemePreference(profile.themePreference);
	return profile;
}

export function setProfile(value: UserProfileDto): void {
	profile = { ...value, themePreference: normalizeThemePreference(value.themePreference) };
	setThemePreference(profile.themePreference);
}
