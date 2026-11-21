import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => ({
	id: params.id,
	iid: params.iid,
	returnTo: ['/today', '/agile'].includes(url.searchParams.get('returnTo') ?? '') ? url.searchParams.get('returnTo') : null,
});
