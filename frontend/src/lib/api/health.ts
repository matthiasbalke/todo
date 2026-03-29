export async function checkHealth(): Promise<boolean> {
	try {
		const response = await fetch('/actuator/health');
		return response.status === 200;
	} catch {
		return false;
	}
}
