import { mockItems, mockCategories, mockLists, mockUsers } from '$lib/mock-data';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
  const list = mockLists.find(l => l.id === params.id);
  if (!list) throw error(404, 'List not found');

  const items = mockItems.filter(i => i.listId === params.id);
  const categories = mockCategories.filter(c => c.listId === params.id);

  return { list, items, categories, users: mockUsers };
};
