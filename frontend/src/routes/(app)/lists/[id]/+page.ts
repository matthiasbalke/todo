import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => ({
	id: params.id,
	focusTitle: url.searchParams.get('focusTitle') === '1',
});
