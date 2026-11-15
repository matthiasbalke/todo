import { describe, expect, it } from 'vitest';
import type { ItemDto } from '$lib/api/items';
import type { TodayItemDto } from '$lib/api/today';
import { dtoToItem } from './items.svelte';
import { todayDtoToItem } from './today.svelte';

const dto: ItemDto = {
	id: 'item', listId: 'list', categoryId: null, title: 'Selected days', notes: null,
	done: false, starred: false, dueDate: '2026-11-02', parentItemId: null,
	createdByUserId: null, updatedByUserId: null, assignedUserIds: [], sortOrder: 0,
	createdAt: '2026-11-01', updatedAt: '2026-11-01',
	recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 2, weekdays: ['MONDAY', 'THURSDAY'] }
};
const today: TodayItemDto = {
	...dto, assignedUsers: [], sourceListName: 'Source', sourceListEmoji: null,
	sourceListRole: 'OWNER', sourceListGroupOrder: null, sourceListOrder: null,
	sourceCategoryName: null, sourceCategoryColor: null, sourceCategoryOrder: null
};
describe('recurrence transport into editable item state', () => {
	it('retains full weekday rules in list and Today mappings', () => {
		expect(dtoToItem(dto).recurrenceRule).toEqual(dto.recurrenceRule);
		expect(todayDtoToItem(today).recurrenceRule).toEqual(dto.recurrenceRule);
	});
	it('retains legacy intervals and null rules in both mappings', () => {
		const rule = { intervalUnit: 'MONTHS', intervalValue: 3 };
		expect(dtoToItem({ ...dto, recurrenceRule: rule }).recurrenceRule).toEqual(rule);
		expect(todayDtoToItem({ ...today, recurrenceRule: rule }).recurrenceRule).toEqual(rule);
		expect(dtoToItem({ ...dto, recurrenceRule: null }).recurrenceRule).toBeNull();
		expect(todayDtoToItem({ ...today, recurrenceRule: null }).recurrenceRule).toBeNull();
	});
});
