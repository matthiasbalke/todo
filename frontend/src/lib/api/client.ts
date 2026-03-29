export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly code?: string,
	) {
		super(message);
	}
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, {
		...init,
		credentials: 'include', // always send HttpOnly cookies
		headers: {
			'Content-Type': 'application/json',
			...init?.headers,
		},
	});
	if (!response.ok) {
		let message = `${response.status} ${response.statusText}`;
		try {
			const body = (await response.json()) as { message?: string; code?: string };
			if (typeof body.message === 'string') message = body.message;
			throw new ApiError(response.status, message, body.code ?? undefined);
		} catch (e) {
			if (e instanceof ApiError) throw e;
			// not JSON or no message — use status text fallback
		}
		throw new ApiError(response.status, message);
	}
	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
}
