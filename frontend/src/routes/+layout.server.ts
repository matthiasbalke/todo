import { env } from '$env/dynamic/private';

export function load() {
	return { buildNumber: env.APP_BUILD_NUMBER ?? '0' };
}
