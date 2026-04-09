import { getMe, getPasskeys } from '$lib/api/users';

export async function load() {
	const [profile, passkeys] = await Promise.all([getMe(), getPasskeys()]);
	return { profile, passkeys };
}
