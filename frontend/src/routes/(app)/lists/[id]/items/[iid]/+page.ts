import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => ({
	id: params.id,
	iid: params.iid,
	returnTo: url.searchParams.get('returnTo') === '/today' ? '/today' : null,
});
