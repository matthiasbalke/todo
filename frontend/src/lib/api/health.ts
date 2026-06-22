export const HEALTH_CHECK_TIMEOUT_MS = 3000;

export async function checkHealth(
	fetchFn: typeof fetch = fetch,
	timeoutMs = HEALTH_CHECK_TIMEOUT_MS,
): Promise<boolean> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetchFn('/actuator/health', { signal: controller.signal });
		return response.status === 200;
	} catch {
		return false;
	} finally {
		clearTimeout(timeout);
	}
}

export async function getBackendVersion(): Promise<string | null> {
	try {
		const response = await fetch('/actuator/info');
		if (!response.ok) return null;
		const data = await response.json();
		const version = data.build?.version as string | undefined;
		const buildNumber = data['build-number'] as string | undefined;
		if (!version) return null;
		return buildNumber && buildNumber !== '0' ? `${version}.${buildNumber}` : version;
	} catch {
		return null;
	}
}
