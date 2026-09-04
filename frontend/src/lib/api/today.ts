import { authedFetch } from './authedClient';
import type { RecurrenceRuleDto } from './items';

export interface TodayItemDto {
	id: string;
	listId: string;
	categoryId: string | null;
	title: string;
	notes: string | null;
	done: boolean;
	starred: boolean;
	dueDate: string | null;
	recurrenceRule: RecurrenceRuleDto | null;
	parentItemId: string | null;
	createdByUserId: string | null;
	updatedByUserId: string | null;
	assignedUsers: { id: string; displayName: string }[];
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
	sourceListName: string;
	sourceListEmoji: string | null;
	sourceListRole: 'OWNER' | 'EDITOR' | 'VIEWER';
	sourceListGroupOrder: number | null;
	sourceListOrder: number | null;
	sourceCategoryName: string | null;
	sourceCategoryColor: string | null;
	sourceCategoryOrder: number | null;
}

export function getTodayItems(fetchFn: typeof fetch = fetch): Promise<TodayItemDto[]> {
	return authedFetch('/api/today', undefined, fetchFn);
}

export async function getTodayCount(fetchFn: typeof fetch = fetch): Promise<number> {
	const response = await authedFetch<{ count: number }>('/api/today/count', undefined, fetchFn);
	return response.count;
}
