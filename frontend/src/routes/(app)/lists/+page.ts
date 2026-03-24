import { mockLists } from '$lib/mock-data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return { lists: mockLists };
};
