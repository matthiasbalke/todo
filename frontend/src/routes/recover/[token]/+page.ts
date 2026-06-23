import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { ApiError } from '$lib/api/client';
import { getRecoveryInfo } from '$lib/api/recovery';

export const ssr = false;

function isBlockedAccountError(e: ApiError): boolean {
	return e.code === 'ACCOUNT_BLOCKED' || /account .*blocked|blocked .*account/i.test(e.message);
}

function recoveryError(e: unknown): never {
	if (e instanceof ApiError) {
		if (e.status === 410) throw error(410, e.message);
		if (e.status === 404) throw error(404, 'Recovery link is invalid or expired.');
		if (e.status === 409 && isBlockedAccountError(e)) {
			throw error(403, 'This account is blocked. Please contact the admin.');
		}
		throw error(e.status, e.message);
	}
	throw error(404, 'Recovery link is invalid or expired.');
}

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		return {
			token: params.token,
			recovery: await getRecoveryInfo(params.token, fetch),
		};
	} catch (e) {
		recoveryError(e);
	}
};
