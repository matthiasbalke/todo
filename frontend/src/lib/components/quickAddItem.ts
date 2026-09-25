import type { Category, RecurrenceRule, TodoItem, User } from '$lib/mock-data';
import { localIsoDate } from '$lib/dateOnly';
import type { ItemFormDraft } from './ItemForm.svelte';

export const recurrenceOptions = [
	{ value: '', label: 'No recurrence' },
	{ value: '1_DAYS', label: 'Every day' },
	{ value: '1_WEEKS', label: 'Every week' },
	{ value: '2_WEEKS', label: 'Every 2 weeks' },
	{ value: '1_MONTHS', label: 'Every month' },
	{ value: '3_MONTHS', label: 'Every 3 months' },
	{ value: '1_YEARS', label: 'Every year' }
];

export const recurrencePresetOptions = recurrenceOptions.map((option) => option.value);

export function getRecurrenceLabel(preset: string): string {
	return recurrenceOptions.find((option) => option.value === preset)?.label ?? preset;
}

export function getRecurrenceSelectedLabel(preset: string): string {
	return preset ? getRecurrenceLabel(preset) : 'No recurrence';
}

export function parseRecurrencePreset(preset: string): RecurrenceRule | null {
	if (!preset) return null;
	const [val, unit] = preset.split('_');
	return { intervalValue: parseInt(val), intervalUnit: unit as RecurrenceRule['intervalUnit'] };
}

export function getEffectiveDefaultCategoryId(
	defaultCategoryId: string | undefined,
	categories: Category[]
): string | null {
	return defaultCategoryId && categories.some((category) => category.id === defaultCategoryId)
		? defaultCategoryId
		: null;
}

export function createQuickAddDraft(
	draft: ItemFormDraft | null | undefined,
	defaultCategoryId: string | undefined,
	categories: Category[]
): ItemFormDraft {
	return {
		title: draft?.title ?? '',
		notes: draft?.notes ?? '',
		dueDate: draft?.dueDate ?? null,
		categoryId: draft?.categoryId ?? getEffectiveDefaultCategoryId(defaultCategoryId, categories),
		assignedUserIds: [...(draft?.assignedUserIds ?? [])],
		recurrencePreset: draft?.recurrencePreset ?? '',
		done: draft?.done ?? false,
		starred: draft?.starred ?? false
	};
}

export function quickAddDraftToTodoItem(
	draft: ItemFormDraft,
	listId: string,
	users: User[]
): TodoItem {
	const now = localIsoDate();
	const knownUserIds = new Set(users.map((user) => user.id));
	return {
		id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
		listId,
		categoryId: draft.categoryId,
		title: draft.title,
		notes: draft.notes || null,
		done: draft.done,
		starred: draft.starred,
		dueDate: draft.dueDate,
		assignedUserIds: draft.assignedUserIds.filter((userId) => knownUserIds.has(userId)),
		recurrenceRule: parseRecurrencePreset(draft.recurrencePreset),
		parentItemId: null,
		createdByUserId: null,
		updatedByUserId: null,
		sortOrder: 999,
		createdAt: now,
		updatedAt: now
	};
}
