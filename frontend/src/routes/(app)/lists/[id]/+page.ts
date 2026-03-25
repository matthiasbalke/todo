import { mockUsers } from '$lib/mock-data';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({ id: params.id, users: mockUsers });
