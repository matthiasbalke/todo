<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { Category, TodoItem, User } from '$lib/mock-data';
	import type { ItemFormCancelContext, ItemFormDraft } from './ItemForm.svelte';
	import Button from './Button.svelte';
	import CategorySelect from './CategorySelect.svelte';
	import Select from './Select.svelte';
	import DatePicker from './DatePicker.svelte';
	import Dialog from './Dialog.svelte';
	import Icon from './Icon.svelte';
	import MultiSelect from './MultiSelect.svelte';
	import RemovableChip from './RemovableChip.svelte';
	import RecurrenceEditor from './RecurrenceEditor.svelte';
	import { editorFromRule, recurrenceError, ruleFromEditor } from '$lib/recurrence';
	import { recurrenceRuleToHuman } from '$lib/utils';
	import Textarea from './Textarea.svelte';
	import TextInput from './TextInput.svelte';
	import { formatDateOnly } from '$lib/dateOnly';
	import { getProfile } from '$lib/stores/preferences.svelte';
	import {
		createQuickAddDraft,
		quickAddDueDate,
		getEffectiveDefaultCategoryId,
		quickAddDraftToTodoItem
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
	let recurrenceState = $state(untrack(() => createQuickAddDraft(draft, defaultCategoryId, categories).recurrenceEditor!));
	let recurrenceRule = $state(untrack(() => createQuickAddDraft(draft, defaultCategoryId, categories).appliedRecurrenceRule ?? null));
	let titleInput = $state<HTMLInputElement | null>(null);
	let categoryTrigger = $state<HTMLButtonElement | null>(null);
	let dueDateTrigger = $state<HTMLButtonElement | null>(null);
	let recurrenceTrigger = $state<HTMLButtonElement | null>(null);
	let assigneesTrigger = $state<HTMLButtonElement | null>(null);
	let notesTrigger = $state<HTMLButtonElement | null>(null);
	let activeDetail = $state<Detail | null>(null);
	let notesEditorDraft = $state('');
	let formElement = $state<HTMLFormElement>();
	let detailElement = $state<HTMLElement>();
	let customDate = $state(false);
	let submitting = $state(false);
	let suppressNextDraftChange = false;
	let transitioning = false;
	let preservingInternalFocus = false;
	let ignoreNextFocusOut = false;

	const selectedAssignees = $derived(users.filter((user) => assignedUserIds.has(user.id)));
	const selectedCategory = $derived(categories.find((category) => category.id === categoryId) ?? null);
	const categoryChipLabel = $derived(selectedCategory?.name ?? '');
	const dueDateChipLabel = $derived(dueDate ? formatDate(dueDate) : '');
	const recurrenceChipLabel = $derived(recurrenceRule ? recurrenceRuleToHuman(recurrenceRule) : '');
	const assigneeChipLabel = $derived(selectedAssignees.map(getUserLabel).join(', '));
	const notesChipLabel = $derived(notes.trim() ? 'Notes' : '');
	const detailTitle = $derived.by(() => {
		switch (activeDetail) {
			case 'category': return 'Category';
			case 'dueDate': return 'Due date';
			case 'recurrence': return 'Recurrence';
			case 'assignees': return 'Assignees';
			case 'notes': return 'Notes';
			default: return '';
		}
	});

	onMount(() => {
		titleInput?.focus();
		function outsidePointer(event: PointerEvent) {
			if (!formElement?.contains(event.target as Node)) {
				if (activeDetail === 'notes' || customDate) return;
				minimize();
			}
		}
		window.addEventListener('pointerdown', outsidePointer, true);
		return () => window.removeEventListener('pointerdown', outsidePointer, true);
	});

	function minimize() {
		if (!formElement?.isConnected || submitting || transitioning || preservingInternalFocus || activeDetail === 'notes' || customDate) return;
		if (activeDetail === 'recurrence' && !recurrenceError(recurrenceState)) recurrenceRule = ruleFromEditor(recurrenceState);
		onDraftChange?.(currentDraft());
		const hasDraft = title.trim() || notes || dueDate || assignedUserIds.size || recurrenceState.mode ||
			categoryId !== getEffectiveDefaultCategoryId(defaultCategoryId, categories);
		if (hasDraft) {
			// Leave the draft visible without taking focus back from the outside target.
			activeDetail = null;
			return;
		}
		oncancel({ reason: 'focusout' });
	}

	function currentDraft(): ItemFormDraft {
		return {
			title,
			notes,
			dueDate,
			categoryId,
			assignedUserIds: [...assignedUserIds],
			recurrencePreset: recurrenceState.mode,
			recurrenceEditor: { ...recurrenceState, weekdays: [...recurrenceState.weekdays] },
			appliedRecurrenceRule: recurrenceRule,
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
		recurrenceState = editorFromRule(null);
		recurrenceRule = null;
	}

	function getUserLabel(user: User): string {
		return user.name || user.email;
	}

	function getUserInitial(user: User): string {
		return getUserLabel(user).trim().charAt(0).toUpperCase() || '?';
	}

	function setAssignedUsers(selectedUsers: User[]) {
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

	async function openDetail(detail: Detail, event: MouseEvent) {
		// The opening click targets a control replaced by the new view.
		// Keep it from dismissing the newly mounted selector at document level.
		event.stopPropagation();
		transitioning = true;
		notesEditorDraft = notes;
		customDate = false;
		activeDetail = detail;
		await tick();
		const input = detailElement?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
		if (input) {
			input.focus();
			if (detail !== 'notes') input.click();
		}
		transitioning = false;
	}

	async function closeDetail() {
		const detail = activeDetail;
		if (detail === 'recurrence' && !recurrenceError(recurrenceState)) recurrenceRule = ruleFromEditor(recurrenceState);
		transitioning = true;
		activeDetail = null;
		await tick();
		titleInput?.focus();
		transitioning = false;
	}

	function detailKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !event.defaultPrevented) {
			event.preventDefault();
			void closeDetail();
		}
	}

	async function openCustomDate() {
		transitioning = true;
		activeDetail = null;
		customDate = true;
		await tick();
		transitioning = false;
	}

	async function closeCustomDate() {
		transitioning = true;
		customDate = false;
		await tick();
		titleInput?.focus();
		transitioning = false;
	}

	function selectCategory(nextCategoryId: string | null) {
		categoryId = nextCategoryId;
		void closeDetail();
	}

	function selectDueDate(nextDueDate: string | null) {
		dueDate = nextDueDate;
		customDate = false;
		void closeDetail();
	}


	function saveDetail() {
		if (activeDetail === 'notes') notes = notesEditorDraft;
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
				recurrenceState = editorFromRule(null);
				recurrenceRule = null;
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
		if (customDate || activeDetail || submitting || !title.trim() || recurrenceError(recurrenceState)) return;
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
	bind:this={formElement}
	onsubmit={handleSubmit}
	onmousedown={() => {
		ignoreNextFocusOut = true;
		setTimeout(() => { ignoreNextFocusOut = false; }, 0);
	}}
	onfocusout={(event) => {
		if (submitting || transitioning || preservingInternalFocus || activeDetail === 'notes' || customDate) return;
		if (event.currentTarget.contains(event.relatedTarget as Node)) return;
		if (ignoreNextFocusOut) return;
		if (event.relatedTarget) { minimize(); return; }
		// Wait until nested controls have completed their own focus restoration.
		setTimeout(() => {
			if (!formElement?.contains(document.activeElement)) minimize();
		}, 0);
	}}
	class="rounded-lg border border-border bg-surface p-3"
>
	{#if !activeDetail}
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
				onclick={(event) => openDetail('category', event)}
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
				onclick={(event) => openDetail('category', event)}
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
				onclick={(event) => openDetail('dueDate', event)}
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
				onclick={(event) => openDetail('dueDate', event)}
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
				onclick={(event) => openDetail('recurrence', event)}
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
				onclick={(event) => openDetail('recurrence', event)}
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
				onclick={(event) => openDetail('assignees', event)}
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
				onclick={(event) => openDetail('assignees', event)}
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
				onclick={(event) => openDetail('notes', event)}
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
				onclick={(event) => openDetail('notes', event)}
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

	{#if recurrenceError(recurrenceState)}
		<p role="alert" class="text-sm text-danger">{recurrenceError(recurrenceState)}</p>
	{/if}
	{:else}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<section bind:this={detailElement} aria-label={detailTitle} onkeydown={detailKeydown} class="flex max-h-[min(60dvh,32rem)] flex-col gap-3">
			<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
				<Button type="button" tone="neutral" appearance="bare" size="small" align="start" onclick={() => closeDetail()}>
					<Icon name="back" size="compact" />{activeDetail === 'notes' ? 'Cancel' : 'Back'}
				</Button>
				<h2 class="text-sm font-semibold text-heading">{detailTitle}</h2>
				{#if activeDetail === 'notes'}
					<Button type="button" appearance="bare" size="small" onclick={saveDetail} class="justify-self-end">Save</Button>
				{/if}
			</div>
			<div class="min-h-0 overflow-y-auto p-1">
			{#if activeDetail === 'category'}
				<CategorySelect
					inlineOptions consumeOutsidePointer={false}
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
				<Select
					options={['Today', 'Tomorrow', 'Next week', 'Custom']}
					ariaLabel="Due date" placeholder="set due date"
					inlineOptions consumeOutsidePointer={false}
					onSelect={(preset) => {
						if (preset === 'Custom') void openCustomDate();
						else selectDueDate(quickAddDueDate(preset, getProfile()?.timeZone));
					}}
				/>
			{:else if activeDetail === 'recurrence'}
                <RecurrenceEditor inlineOptions consumeOutsidePointer={false} bind:value={recurrenceState} rule={recurrenceRule}
                    onapply={(rule) => { recurrenceRule = rule; }} onbasic={() => closeDetail()} />
			{:else if activeDetail === 'assignees'}
				<MultiSelect
					inlineOptions consumeOutsidePointer={false}
					options={users}
					selected={selectedAssignees}
					ariaLabel="Assignees"
					placeholder="add assignee"
					labelId="quick-add-assignees"
					getOptionLabel={getUserLabel}
					optionKey={(user) => user.id}
					onChange={setAssignedUsers}
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
					bind:value={notesEditorDraft}
					ariaLabel="Notes"
					placeholder="add note"
					rows={8}
					resize="none"
					appearance="inline"
				/>
			{/if}

			</div>
		</section>
	{/if}
</form>

{#if customDate}
	<Dialog title="Due date" onclose={closeCustomDate} returnFocusTo={titleInput} showFooter={false}
		class="!fixed left-1/2 top-1/2 !m-0 w-[calc(100%-2rem)] !max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto -translate-x-1/2 -translate-y-1/2">
		<DatePicker initiallyOpen inlineCalendar consumeOutsidePointer={false} value={dueDate}
			ariaLabel="Due date" onSelect={selectDueDate} onDismiss={closeCustomDate} />
	</Dialog>
{/if}

<style>
	.quick-add-detail-scroll {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.quick-add-detail-scroll::-webkit-scrollbar {
		display: none;
	}
</style>
