import * as todayApi from '$lib/api/today';
import type { TodayItemDto } from '$lib/api/today';
import type { IntervalUnit, TodoItem } from '$lib/mock-data';

let entries = $state<TodayItemDto[]>([]);
let unfinishedCount = $state(0);
let loading = $state(false);

export function getTodayEntries(): TodayItemDto[] {
	return entries;
}

export function getTodayUnfinishedCount(): number {
	return unfinishedCount;
}

export function isTodayLoading(): boolean {
	return loading;
}

export function todayDtoToItem(dto: TodayItemDto): TodoItem {
	return {
		id: dto.id,
		listId: dto.listId,
		categoryId: dto.categoryId,
		title: dto.title,
		notes: dto.notes,
		done: dto.done,
		starred: dto.starred,
		dueDate: dto.dueDate,
		recurrenceRule: dto.recurrenceRule
			? { intervalUnit: dto.recurrenceRule.intervalUnit as IntervalUnit, intervalValue: dto.recurrenceRule.intervalValue }
		: null,
		parentItemId: dto.parentItemId,
		createdByUserId: dto.createdByUserId,
		updatedByUserId: dto.updatedByUserId,
		assignedUserIds: dto.assignedUsers.map((user) => user.id),
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt,
	};
}

export async function loadToday(fetchFn: typeof fetch = fetch): Promise<void> {
	loading = true;
	try {
		entries = await todayApi.getTodayItems(fetchFn);
		unfinishedCount = entries.filter((entry) => !entry.done).length;
	} finally {
		loading = false;
	}
}

export async function loadTodayCount(fetchFn: typeof fetch = fetch): Promise<void> {
	unfinishedCount = await todayApi.getTodayCount(fetchFn);
}

export async function refreshToday(): Promise<void> {
	await Promise.all([loadToday(), loadTodayCount()]);
}
