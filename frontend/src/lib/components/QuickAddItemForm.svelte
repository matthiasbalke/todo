<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { Category, TodoItem, User } from '$lib/mock-data';
	import type { ItemFormCancelContext, ItemFormDraft } from './ItemForm.svelte';
	import Button from './Button.svelte';
	import CategorySelect from './CategorySelect.svelte';
	import DatePicker from './DatePicker.svelte';
	import Dialog from './Dialog.svelte';
	import Icon from './Icon.svelte';
	import MultiSelect from './MultiSelect.svelte';
	import RemovableChip from './RemovableChip.svelte';
	import Select from './Select.svelte';
	import Textarea from './Textarea.svelte';
	import TextInput from './TextInput.svelte';
	import { formatDateOnly } from '$lib/dateOnly';
	import {
		createQuickAddDraft,
		getEffectiveDefaultCategoryId,
		getRecurrenceLabel,
		getRecurrenceSelectedLabel,
		quickAddDraftToTodoItem,
		recurrencePresetOptions
	} from './quickAddItem';

	type Detail = 'category' | 'dueDate' | 'recurrence' | 'assignees' | 'notes';

	let {
		listId,
		categories,
		users,
		onsubmit,
		oncancel,
		draft,
		onDraftChange,
		defaultCategoryId = ''
	}: {
		listId: string;
		categories: Category[];
		users: User[];
		onsubmit: (item: TodoItem) => Promise<void> | void;
		oncancel: (context?: ItemFormCancelContext) => void;
		draft?: ItemFormDraft | null;
		onDraftChange?: (draft: ItemFormDraft) => void;
		defaultCategoryId?: string;
	} = $props();

	let title = $state(untrack(() => createQuickAddDraft(draft, defaultCategoryId, categories).title));
	let notes = $state(untrack(() => createQuickAddDraft(draft, defaultCategoryId, categories).notes));
	let dueDate = $state<string | null>(untrack(() => createQuickAddDraft(draft, defaultCategoryId, categories).dueDate));
	let categoryId = $state<string | null>(untrack(() => createQuickAddDraft(draft, defaultCategoryId, categories).categoryId));
	let assignedUserIds = $state(new Set(untrack(() => createQuickAddDraft(draft, defaultCategoryId, categories).assignedUserIds)));
	let recurrencePreset = $state(untrack(() => createQuickAddDraft(draft, defaultCategoryId, categories).recurrencePreset));
	let titleInput = $state<HTMLInputElement | null>(null);
	let categoryTrigger = $state<HTMLButtonElement | null>(null);
	let dueDateTrigger = $state<HTMLButtonElement | null>(null);
	let recurrenceTrigger = $state<HTMLButtonElement | null>(null);
	let assigneesTrigger = $state<HTMLButtonElement | null>(null);
	let notesTrigger = $state<HTMLButtonElement | null>(null);
	let notesTextarea = $state<HTMLTextAreaElement | null>(null);
	let activeDetail = $state<Detail | null>(null);
	let dialogNotes = $state('');
	let submitting = $state(false);
	let suppressNextDraftChange = false;
	let returningDialogFocus = false;
	let preservingInternalFocus = false;
	let ignoreNextFocusOut = false;

	const selectedAssignees = $derived(users.filter((user) => assignedUserIds.has(user.id)));
	const selectedCategory = $derived(categories.find((category) => category.id === categoryId) ?? null);
	const categoryChipLabel = $derived(selectedCategory?.name ?? '');
	const dueDateChipLabel = $derived(dueDate ? formatDate(dueDate) : '');
	const recurrenceChipLabel = $derived(recurrencePreset ? getRecurrenceLabel(recurrencePreset) : '');
	const assigneeChipLabel = $derived(selectedAssignees.map(getUserLabel).join(', '));
	const notesChipLabel = $derived(notes.trim() ? 'Notes' : '');
	const dialogTitle = $derived.by(() => {
		switch (activeDetail) {
			case 'category': return 'Category';
			case 'dueDate': return 'Due date';
			case 'recurrence': return 'Recurrence';
			case 'assignees': return 'Assignees';
			case 'notes': return 'Notes';
			default: return '';
		}
	});

	onMount(() => titleInput?.focus());

	function currentDraft(): ItemFormDraft {
		return {
			title,
			notes,
			dueDate,
			categoryId,
			assignedUserIds: [...assignedUserIds],
			recurrencePreset,
			done: false,
			starred: false
		};
	}

	function resetDraft() {
		suppressNextDraftChange = true;
		title = '';
		notes = '';
		dueDate = null;
		categoryId = getEffectiveDefaultCategoryId(defaultCategoryId, categories);
		assignedUserIds = new Set();
		recurrencePreset = '';
	}

	function getUserLabel(user: User): string {
		return user.name || user.email;
	}

	function getUserInitial(user: User): string {
		return getUserLabel(user).trim().charAt(0).toUpperCase() || '?';
	}

	function setDialogAssignedUsers(selectedUsers: User[]) {
		assignedUserIds = new Set(selectedUsers.map((user) => user.id));
	}

	function formatDate(value: string): string {
		return formatDateOnly(value, undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function getTrigger(detail: Detail): HTMLButtonElement | null {
		switch (detail) {
			case 'category': return categoryTrigger;
			case 'dueDate': return dueDateTrigger;
			case 'recurrence': return recurrenceTrigger;
			case 'assignees': return assigneesTrigger;
			case 'notes': return notesTrigger;
		}
	}

	function openDetail(detail: Detail) {
		dialogNotes = notes;
		activeDetail = detail;
		ignoreNextFocusOut = true;
		if (detail === 'notes') {
			tick().then(() => notesTextarea?.focus());
		}
	}

	function closeDetail(returnFocus = true) {
		const detail = activeDetail;
		returningDialogFocus = returnFocus;
		activeDetail = null;
		ignoreNextFocusOut = false;
		if (returnFocus && detail) {
			tick().then(() => {
				getTrigger(detail)?.focus();
				returningDialogFocus = false;
			});
		}
	}

	function selectCategory(nextCategoryId: string | null) {
		categoryId = nextCategoryId;
		closeDetail();
	}

	function selectDueDate(nextDueDate: string | null) {
		dueDate = nextDueDate;
		closeDetail();
	}

	function selectRecurrence(nextRecurrencePreset: string) {
		recurrencePreset = nextRecurrencePreset;
		closeDetail();
	}

	function saveDetail() {
		if (activeDetail === 'notes') notes = dialogNotes;
		closeDetail();
	}

	async function clearDetail(detail: Detail) {
		preservingInternalFocus = true;
		ignoreNextFocusOut = true;
		switch (detail) {
			case 'category':
				categoryId = null;
				break;
			case 'dueDate':
				dueDate = null;
				break;
			case 'recurrence':
				recurrencePreset = '';
				break;
			case 'assignees':
				assignedUserIds = new Set();
				break;
			case 'notes':
				notes = '';
				break;
		}
		await tick();
		getTrigger(detail)?.focus();
		preservingInternalFocus = false;
		ignoreNextFocusOut = false;
	}

	$effect(() => {
		if (suppressNextDraftChange) {
			suppressNextDraftChange = false;
			return;
		}
		onDraftChange?.(currentDraft());
	});

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (submitting || !title.trim()) return;
		submitting = true;
		try {
			await onsubmit(quickAddDraftToTodoItem(currentDraft(), listId, users));
			resetDraft();
			await tick();
			titleInput?.focus();
		} catch {
			// The parent surfaces the error; failed submits keep the current quick-add draft visible.
		} finally {
			submitting = false;
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
	onsubmit={handleSubmit}
	onmousedown={() => {
		ignoreNextFocusOut = true;
		setTimeout(() => { ignoreNextFocusOut = false; }, 0);
	}}
	onfocusout={(event) => {
		if (submitting || activeDetail || returningDialogFocus || preservingInternalFocus) return;
		if (ignoreNextFocusOut) { ignoreNextFocusOut = false; return; }
		if (!event.currentTarget.contains(event.relatedTarget as Node)) oncancel({ reason: 'focusout' });
	}}
	class="rounded-lg border border-border bg-surface p-3"
>
	<div
		class="quick-add-detail-scroll mb-3 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1"
		aria-label="Item details"
		data-testid="quick-add-detail-controls"
	>
		{#if categoryChipLabel}
			<RemovableChip
				bind:element={categoryTrigger}
				aria-label="Category"
				removeLabel="Clear Category value"
				onclick={() => openDetail('category')}
				onremove={() => clearDetail('category')}
			>
				<Icon name="category" size="metadata" />
				<span class="max-w-28 truncate">{categoryChipLabel}</span>
			</RemovableChip>
		{:else}
			<Button
				bind:element={categoryTrigger}
				type="button"
				tone="neutral"
				appearance="bare"
				size="icon-standard"
				aria-label="Category"
				onclick={() => openDetail('category')}
				class="shrink-0"
			>
				<Icon name="category" size="compact" />
			</Button>
		{/if}
		{#if dueDateChipLabel}
			<RemovableChip
				bind:element={dueDateTrigger}
				aria-label="Due date"
				removeLabel="Clear Due date value"
				onclick={() => openDetail('dueDate')}
				onremove={() => clearDetail('dueDate')}
			>
				<Icon name="date" size="metadata" />
				<span>{dueDateChipLabel}</span>
			</RemovableChip>
		{:else}
			<Button
				bind:element={dueDateTrigger}
				type="button"
				tone="neutral"
				appearance="bare"
				size="icon-standard"
				aria-label="Due date"
				onclick={() => openDetail('dueDate')}
				class="shrink-0"
			>
				<Icon name="date" size="compact" />
			</Button>
		{/if}
		{#if recurrenceChipLabel}
			<RemovableChip
				bind:element={recurrenceTrigger}
				aria-label="Recurrence"
				removeLabel="Clear Recurrence value"
				onclick={() => openDetail('recurrence')}
				onremove={() => clearDetail('recurrence')}
			>
				<Icon name="recurrence" size="metadata" />
				<span>{recurrenceChipLabel}</span>
			</RemovableChip>
		{:else}
			<Button
				bind:element={recurrenceTrigger}
				type="button"
				tone="neutral"
				appearance="bare"
				size="icon-standard"
				aria-label="Recurrence"
				onclick={() => openDetail('recurrence')}
				class="shrink-0"
			>
				<Icon name="recurrence" size="compact" />
			</Button>
		{/if}
		{#if assigneeChipLabel}
			<RemovableChip
				bind:element={assigneesTrigger}
				aria-label="Assignees"
				removeLabel="Clear Assignees value"
				onclick={() => openDetail('assignees')}
				onremove={() => clearDetail('assignees')}
			>
				<Icon name="assignee" size="metadata" />
				<span class="max-w-36 truncate">{assigneeChipLabel}</span>
			</RemovableChip>
		{:else}
			<Button
				bind:element={assigneesTrigger}
				type="button"
				tone="neutral"
				appearance="bare"
				size="icon-standard"
				aria-label="Assignees"
				onclick={() => openDetail('assignees')}
				class="shrink-0"
			>
				<Icon name="assignee" size="compact" />
			</Button>
		{/if}
		{#if notesChipLabel}
			<RemovableChip
				bind:element={notesTrigger}
				aria-label="Notes"
				removeLabel="Clear Notes value"
				onclick={() => openDetail('notes')}
				onremove={() => clearDetail('notes')}
			>
				<Icon name="notes" size="metadata" />
				<span>{notesChipLabel}</span>
			</RemovableChip>
		{:else}
			<Button
				bind:element={notesTrigger}
				type="button"
				tone="neutral"
				appearance="bare"
				size="icon-standard"
				aria-label="Notes"
				onclick={() => openDetail('notes')}
				class="shrink-0"
			>
				<Icon name="notes" size="compact" />
			</Button>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		<TextInput
			bind:element={titleInput}
			bind:value={title}
			onkeydown={(event) => { if (event.key === 'Enter') { event.preventDefault(); handleSubmit(event); } }}
			placeholder="Item title"
			ariaLabel="Item title"
			appearance="inline"
			required
			containerClass="min-w-0 flex-1"
			class="w-full"
		/>
	</div>

	{#if activeDetail}
		<Dialog
			title={dialogTitle}
			onclose={() => closeDetail(false)}
			returnFocusTo={getTrigger(activeDetail)}
			showFooter={activeDetail === 'notes'}
		>
			{#if activeDetail === 'category'}
				<CategorySelect
					categories={categories}
					selectedCategoryId={categoryId}
					label=""
					ariaLabel="Category"
					placeholder="category"
					emptySelectedLabel="Uncategorized"
					labelId="quick-add-category"
					onSelect={selectCategory}
				/>
			{:else if activeDetail === 'dueDate'}
				<DatePicker value={dueDate} ariaLabel="Due date" placeholder="set due date" onSelect={selectDueDate} />
			{:else if activeDetail === 'recurrence'}
				<Select
					options={recurrencePresetOptions}
					selected={recurrencePreset}
					ariaLabel="Recurrence"
					placeholder="No recurrence"
					labelId="quick-add-recurrence"
					getOptionLabel={getRecurrenceLabel}
					getSelectedLabel={getRecurrenceSelectedLabel}
					isSelectedMuted={(preset) => !preset}
					onSelect={selectRecurrence}
				/>
			{:else if activeDetail === 'assignees'}
				<MultiSelect
					options={users}
					selected={selectedAssignees}
					ariaLabel="Assignees"
					placeholder="add assignee"
					labelId="quick-add-assignees"
					getOptionLabel={getUserLabel}
					optionKey={(user) => user.id}
					onChange={setDialogAssignedUsers}
				>
					{#snippet selectedContent(user)}
						<span class="inline-flex min-w-0 items-center gap-1">
							<span class="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-semibold text-primary-strong" aria-hidden="true">
								{getUserInitial(user)}
							</span>
							<span class="truncate">{getUserLabel(user)}</span>
						</span>
					{/snippet}

					{#snippet optionContent(user)}
						<span class="inline-flex min-w-0 items-center gap-2">
							<span class="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-surface-subtle text-xs font-semibold text-supporting" aria-hidden="true">
								{getUserInitial(user)}
							</span>
							<span class="min-w-0 truncate">{getUserLabel(user)}</span>
						</span>
					{/snippet}
				</MultiSelect>
			{:else if activeDetail === 'notes'}
				<Textarea
					bind:element={notesTextarea}
					bind:value={dialogNotes}
					ariaLabel="Notes"
					placeholder="add note"
					rows={8}
					resize="none"
					appearance="inline"
				/>
			{/if}

			{#snippet footer()}
				{#if activeDetail === 'notes'}
					<Button type="button" onclick={saveDetail}>Save</Button>
				{/if}
			{/snippet}
		</Dialog>
	{/if}
</form>

<style>
	.quick-add-detail-scroll {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.quick-add-detail-scroll::-webkit-scrollbar {
		display: none;
	}
</style>
