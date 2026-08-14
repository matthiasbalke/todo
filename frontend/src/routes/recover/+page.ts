import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const ssr = false;

export const load: PageLoad = () => {
	throw error(404, 'Recovery link is invalid or expired.');
};
