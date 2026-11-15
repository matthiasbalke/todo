import type { Category, RecurrenceRule, TodoItem, User } from '$lib/mock-data';
import { localIsoDate } from '$lib/dateOnly';
import type { ItemFormDraft } from './ItemForm.svelte';
import { editorFromLegacy, ruleFromEditor, ruleFromDraft } from '$lib/recurrence';

export function parseRecurrencePreset(preset: string): RecurrenceRule | null {
	return ruleFromEditor(editorFromLegacy(preset));
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
	const recurrenceEditor = draft?.recurrenceEditor
		? { ...draft.recurrenceEditor, weekdays: [...draft.recurrenceEditor.weekdays] }
		: editorFromLegacy(draft?.recurrencePreset ?? '');
	return {
		title: draft?.title ?? '',
		notes: draft?.notes ?? '',
		dueDate: draft?.dueDate ?? null,
		categoryId: draft?.categoryId ?? getEffectiveDefaultCategoryId(defaultCategoryId, categories),
		assignedUserIds: [...(draft?.assignedUserIds ?? [])],
		recurrencePreset: draft?.recurrencePreset ?? '',
		recurrenceEditor,
		appliedRecurrenceRule: ruleFromDraft(recurrenceEditor, draft?.appliedRecurrenceRule),
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
		recurrenceRule: draft.recurrenceEditor ? ruleFromEditor(draft.recurrenceEditor) : parseRecurrencePreset(draft.recurrencePreset),
		parentItemId: null,
		createdByUserId: null,
		updatedByUserId: null,
		sortOrder: 999,
		createdAt: now,
		updatedAt: now
	};
}
