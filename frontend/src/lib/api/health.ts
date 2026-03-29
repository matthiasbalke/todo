export async function checkHealth(): Promise<boolean> {
	try {
		const response = await fetch('/actuator/health');
		return response.status === 200;
	} catch {
		return false;
	}
}

export async function getBackendVersion(): Promise<string | null> {
	try {
		const response = await fetch('/actuator/info');
		if (!response.ok) return null;
		const data = await response.json();
		return (data.build?.version as string) ?? null;
	} catch {
		return null;
	}
}
