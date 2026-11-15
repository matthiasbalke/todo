<script module lang="ts">
  export interface ItemFormDraft {
    title: string;
    notes: string;
    dueDate: string | null;
    categoryId: string | null;
    assignedUserIds: string[];
    recurrencePreset: string;
    recurrenceEditor?: import('$lib/recurrence').RecurrenceEditorState;
    appliedRecurrenceRule?: import('$lib/mock-data').RecurrenceRule | null;
    done: boolean;
    starred: boolean;
  }

  export const NOTES_PREVIEW_LIMIT = 160;

  export type ItemFormCancelReason = 'explicit' | 'focusout';
  export interface ItemFormCancelContext {
    reason: ItemFormCancelReason;
  }
</script>

<script lang="ts">
  import { untrack, onMount, tick } from 'svelte';
  import type { TodoItem, Category, User, RecurrenceRule } from '$lib/mock-data';
  import CategorySelect from './CategorySelect.svelte';
  import CompletionToggle from './CompletionToggle.svelte';
  import DatePicker from './DatePicker.svelte';
  import Icon from './Icon.svelte';
  import ItemAuditMetadata from './ItemAuditMetadata.svelte';
  import MultiSelect from './MultiSelect.svelte';
  import RecurrenceEditor from './RecurrenceEditor.svelte';
  import { editorFromRule, editorFromLegacy, recurrenceError, recurrenceKey, ruleFromDraft, type RecurrenceEditorState } from '$lib/recurrence';
  import StarToggle from './StarToggle.svelte';
  import Textarea from './Textarea.svelte';
  import { controlPlaceholderTextClasses, controlValueTextClasses } from './controlStyles';
  import TextInput from './TextInput.svelte';
  import Button from './Button.svelte';
  import { localIsoDate } from '$lib/dateOnly';
  import { getPrimaryScrollElement } from '$lib/appScroller';

  let {
    item,
    listId,
    categories,
    users,
    onsubmit,
    oncancel,
    onDoneChange,
    onStarredChange,
    draft,
    onDraftChange,
    defaultCategoryId = ''
  }: {
    item?: TodoItem | null;
    listId: string;
    categories: Category[];
    users: User[];
    onsubmit: (item: TodoItem) => Promise<void> | void;
    oncancel: (context?: ItemFormCancelContext) => void;
    onDoneChange?: (done: boolean) => Promise<void> | void;
    onStarredChange?: (starred: boolean) => Promise<void> | void;
    draft?: ItemFormDraft | null;
    onDraftChange?: (draft: ItemFormDraft) => void;
    defaultCategoryId?: string;
  } = $props();

  const isNew = $derived(!item);

  let title = $state(untrack(() => item?.title ?? draft?.title ?? ''));
  let notes = $state(untrack(() => item?.notes ?? draft?.notes ?? ''));
  let dueDate = $state<string | null>(untrack(() => item?.dueDate ?? draft?.dueDate ?? null));
  let categoryId = $state<string | null>(untrack(() => item?.categoryId ?? draft?.categoryId ?? getEffectiveDefaultCategoryId()));
  let assignedUserIds = $state(new Set<string>(untrack(() => item?.assignedUserIds ?? draft?.assignedUserIds ?? [])));
  let recurrenceState = $state<RecurrenceEditorState>(untrack(() => item ? editorFromRule(item.recurrenceRule ?? null) : draft?.recurrenceEditor ?? editorFromLegacy(draft?.recurrencePreset ?? '')));
  let recurrenceRule = $state<RecurrenceRule | null>(untrack(() => item ? item.recurrenceRule : ruleFromDraft(recurrenceState, draft?.appliedRecurrenceRule)));
  let recurrenceOpen = $state(false);
  let done = $state(untrack(() => item?.done ?? draft?.done ?? false));
  let starred = $state(untrack(() => item?.starred ?? draft?.starred ?? false));
  let titleInput = $state<HTMLInputElement | null>(null);
  let notesTrigger = $state<HTMLButtonElement | null>(null);
  let notesTextarea = $state<HTMLTextAreaElement | null>(null);
  let notesEditorOpen = $state(false);
  let notesEditorDraft = $state('');
  let submitting = $state(false);
  let saveError = $state<string | null>(null);
  let mounted = $state(false);
  let lastCommittedSelectionState = $state('');
  let lastCommittedItemState = $state('');
  let saveToken = 0;
  let ignoreNextFocusOut = false;
  let returningNotesFocus = false;
  let suppressNextDraftChange = false;

  interface SelectionState {
    categoryId: string | null;
    dueDate: string | null;
    assignedUserIds: string[];
    recurrencePreset: string;
  }

  onMount(() => {
    titleInput?.focus();
    lastCommittedSelectionState = selectionStateKey();
    if (item) lastCommittedItemState = itemStateKey(item);
    mounted = true;
  });

  function getEffectiveDefaultCategoryId(): string | null {
    return defaultCategoryId && categories.some((category) => category.id === defaultCategoryId)
      ? defaultCategoryId
      : null;
  }

  function applyRecurrence(rule: RecurrenceRule | null) {
    recurrenceRule = rule;
    if (!isNew) tick().then(() => commitExisting({}, { releaseFocus: false }));
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
      done,
      starred
    };
  }

  function resetNewItemDraft() {
    suppressNextDraftChange = true;
    title = '';
    notes = '';
    dueDate = null;
    categoryId = getEffectiveDefaultCategoryId();
    assignedUserIds = new Set();
    recurrenceState = editorFromRule(null);
    recurrenceRule = null;
    done = false;
    starred = false;
  }

  function getUserLabel(user: User): string {
    return user.name || user.email;
  }

  function getUserInitial(user: User): string {
    return getUserLabel(user).trim().charAt(0).toUpperCase() || '?';
  }

  const selectedAssignees = $derived(users.filter((user) => assignedUserIds.has(user.id)));

  function setAssignedUsers(selectedUsers: User[]) {
    assignedUserIds = new Set(selectedUsers.map((user) => user.id));
  }

  const notesPreview = $derived(
    notes.length > NOTES_PREVIEW_LIMIT ? `${notes.slice(0, NOTES_PREVIEW_LIMIT)}...` : notes
  );
  const notesPreviewButtonClasses = $derived(notes ? 'min-h-24 w-full items-start' : 'min-h-10 w-full');
  const notesPreviewTextClasses = $derived(
    notes
      ? `whitespace-pre-wrap text-left ${controlValueTextClasses}`
      : `text-left ${controlPlaceholderTextClasses}`
  );

  function openNotesEditor() {
    notesEditorDraft = notes;
    notesEditorOpen = true;
    ignoreNextFocusOut = true;
    tick().then(() => notesTextarea?.focus());
  }

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      }
    };
  }

  function closeNotesEditor({ returnFocus = true }: { returnFocus?: boolean } = {}) {
    returningNotesFocus = returnFocus;
    notesEditorOpen = false;
    if (returnFocus) {
      tick().then(() => {
        notesTrigger?.focus();
        returningNotesFocus = false;
      });
    }
  }

  async function saveNotesEditor() {
    const nextNotes = notesEditorDraft;
    notes = nextNotes;
    if (!isNew) {
      await commitExisting({ notes: nextNotes || null });
    }
    closeNotesEditor();
  }

  function cancelNotesEditor() {
    closeNotesEditor();
  }

  function handleNotesEditorKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelNotesEditor();
    }
  }

  async function toggleDoneState() {
    const nextDone = !done;
    done = nextDone;
    try {
      if (onDoneChange) await onDoneChange(nextDone);
      else if (!isNew) await commitExisting({ done: nextDone });
    } catch {
      done = !nextDone;
    }
  }

  async function toggleStarredState() {
    const nextStarred = !starred;
    starred = nextStarred;
    try {
      if (onStarredChange) await onStarredChange(nextStarred);
      else if (!isNew) await commitExisting({ starred: nextStarred });
    } catch {
      starred = !nextStarred;
    }
  }

  $effect(() => {
    if (!isNew) return;
    if (suppressNextDraftChange) {
      suppressNextDraftChange = false;
      return;
    }
    onDraftChange?.(currentDraft());
  });

  function currentSelectionState(): SelectionState {
    return {
      categoryId,
      dueDate,
      assignedUserIds: [...assignedUserIds].sort(),
      recurrencePreset: recurrenceKey(recurrenceRule)
    };
  }

  function selectionStateKey(state: SelectionState = currentSelectionState()): string {
    return JSON.stringify(state);
  }

  function shouldReleaseFocusForSelectionChange(previousKey: string, nextState: SelectionState): boolean {
    try {
      const previous = JSON.parse(previousKey) as SelectionState;
      return (
        previous.categoryId !== nextState.categoryId ||
        previous.dueDate !== nextState.dueDate
      );
    } catch {
      return true;
    }
  }

  function itemStateKey(value: TodoItem): string {
    return JSON.stringify({
      title: value.title,
      notes: value.notes ?? null,
      categoryId: value.categoryId,
      dueDate: value.dueDate,
      done: value.done,
      starred: value.starred,
      recurrenceRule: recurrenceKey(value.recurrenceRule),
      assignedUserIds: [...(value.assignedUserIds ?? [])].sort(),
      sortOrder: value.sortOrder
    });
  }

  function releaseActiveFocus() {
    if (typeof document === 'undefined') return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }

  function scrollEditControlIntoView(element: HTMLElement) {
    if (isNew || typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    const visibleTop = viewport?.offsetTop ?? 0;
    const targetTop = visibleTop + 96;
    const currentTop = element.getBoundingClientRect().top;
    const scroller = getPrimaryScrollElement();
    if (!scroller) return;
    scroller.scrollTop += currentTop - targetTop;
  }

  function scrollEditControlOnInteraction(
    element: HTMLElement,
    options: { deferredPointerTarget?: string } = {}
  ) {
    const scroll = (event: Event) => {
      if ((event.target as Element | null)?.closest('[role="listbox"]')) return;
      scrollEditControlIntoView(element);
      if (
        event.type === 'pointerdown' &&
        options.deferredPointerTarget &&
        (event.target as Element | null)?.closest(options.deferredPointerTarget)
      ) {
        window.setTimeout(() => {
          scrollEditControlIntoView(element);
        }, 250);
      }
    };
    const pointerOptions = { capture: true };
    element.addEventListener('pointerdown', scroll, pointerOptions);
    element.addEventListener('focusin', scroll);
    return {
      destroy() {
        element.removeEventListener('pointerdown', scroll, pointerOptions);
        element.removeEventListener('focusin', scroll);
      }
    };
  }

  $effect(() => {
    const nextState = currentSelectionState();
    const nextKey = selectionStateKey(nextState);
    if (!mounted || isNew) {
      lastCommittedSelectionState = nextKey;
      return;
    }
    if (nextKey === lastCommittedSelectionState) return;
    const releaseFocus = shouldReleaseFocusForSelectionChange(lastCommittedSelectionState, nextState);
    lastCommittedSelectionState = nextKey;
    commitExisting({}, { releaseFocus });
  });

  function buildTodoItem(overrides: Partial<TodoItem> = {}): TodoItem {
    const now = localIsoDate();
    return {
      id: item?.id ?? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
      listId,
      categoryId,
      title,
      notes: notes || null,
      done,
      starred,
      dueDate,
      assignedUserIds: [...assignedUserIds],
      recurrenceRule,
      parentItemId: item?.parentItemId ?? null,
      createdByUserId: item?.createdByUserId ?? null,
      updatedByUserId: item?.updatedByUserId ?? null,
      sortOrder: item?.sortOrder ?? 999,
      createdAt: item?.createdAt ?? now,
      updatedAt: item?.updatedAt ?? now,
      ...overrides
    };
  }

  async function commitExisting(
    overrides: Partial<TodoItem> = {},
    options: { releaseFocus?: boolean } = {}
  ) {
    if (isNew || submitting) return;
    const submitted = buildTodoItem(overrides);
    if (itemStateKey(submitted) === lastCommittedItemState) {
      if (options.releaseFocus) releaseActiveFocus();
      return;
    }

    const token = ++saveToken;
    submitting = true;
    saveError = null;
    try {
      await onsubmit(submitted);
      if (token === saveToken) {
        lastCommittedSelectionState = selectionStateKey();
        lastCommittedItemState = itemStateKey(submitted);
        if (options.releaseFocus) releaseActiveFocus();
      }
    } catch {
      if (token === saveToken) saveError = 'Changes could not be saved.';
    } finally {
      if (token === saveToken) {
        submitting = false;
        if (!saveError && itemStateKey(buildTodoItem()) !== lastCommittedItemState) void commitExisting();
      }
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (submitting || recurrenceError(recurrenceState)) return;
    submitting = true;
    try {
      const submitted = buildTodoItem();
      await onsubmit(submitted);
      if (isNew) {
        resetNewItemDraft();
        titleInput?.focus();
      }
    } catch {
      // Callers own user-facing error handling; failed submits keep the current draft intact.
    } finally {
      submitting = false;
    }
  }

  async function commitTitle(options: { releaseFocus?: boolean } = {}) {
    const trimmed = title.trim();
    if (!trimmed) return;
    title = trimmed;
    if (isNew) {
      if (options.releaseFocus) releaseActiveFocus();
      return;
    }
    await commitExisting({ title: trimmed }, options);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
  onsubmit={handleSubmit}
  onmousedown={() => {
    ignoreNextFocusOut = true;
    setTimeout(() => { ignoreNextFocusOut = false; }, 0);
  }}
  onfocusout={(e) => {
    if (submitting || returningNotesFocus || recurrenceOpen) return;
    if (ignoreNextFocusOut) { ignoreNextFocusOut = false; return; }
    if (isNew && !e.currentTarget.contains(e.relatedTarget as Node)) oncancel({ reason: 'focusout' });
  }}
  class="bg-surface rounded-xl border border-border p-4 space-y-4"
>
  <div class="flex items-center gap-2">
    <CompletionToggle size="form" {done} onactivate={toggleDoneState} />
    <TextInput
      bind:element={titleInput}
      bind:value={title}
      onblur={() => { commitTitle(); }}
      onkeydown={async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (isNew) handleSubmit(e);
          else await commitTitle({ releaseFocus: true });
        }
      }}
      placeholder="Item title"
      ariaLabel="Item title"
      appearance="inline"
      size="title"
      required
      containerClass="min-w-0 flex-1"
      class="w-full"
    />
    <StarToggle size="form" {starred} onactivate={toggleStarredState} />
  </div>

  <div class="space-y-1">
    <div
      use:scrollEditControlOnInteraction
      class="flex items-start gap-3 rounded-lg px-1 py-1"
    >
      <Icon name="category" size="action" tone="muted" class="mt-3 flex-shrink-0" />
      <div class="min-w-0 flex-1">
    <CategorySelect
      categories={categories}
      bind:selectedCategoryId={categoryId}
          label=""
          ariaLabel="Category"
          placeholder="category"
          emptySelectedLabel="assign category"
      labelId="categoryId"
          size="display"
          appearance="inline"
    />
      </div>
    </div>

    <div
      use:scrollEditControlOnInteraction
      class="flex items-start gap-3 rounded-lg px-1 py-1"
    >
      <Icon name="date" size="action" tone="muted" class="mt-3 flex-shrink-0" />
      <div class="min-w-0 flex-1">
        <DatePicker bind:value={dueDate} ariaLabel="Due Date" placeholder="set due date" appearance="inline" />
      </div>
    </div>

    <div
      use:scrollEditControlOnInteraction
      class="flex items-start gap-3 rounded-lg px-1 py-1"
    >
      <Icon name="recurrence" size="action" tone="muted" class="mt-3 flex-shrink-0" />
      <div class="min-w-0 flex-1">
        <RecurrenceEditor standalone bind:value={recurrenceState} rule={recurrenceRule}
          onapply={applyRecurrence} onopenchange={(open) => { recurrenceOpen = open; }} />
      </div>
    </div>

    <div
      use:scrollEditControlOnInteraction={{ deferredPointerTarget: '[data-assignee-selected-value]' }}
      class="flex items-start gap-3 rounded-lg px-1 py-1"
    >
      <Icon name="assignee" size="action" tone="muted" class="mt-3 flex-shrink-0" />
      <div class="min-w-0 flex-1">
        <MultiSelect
          options={users}
          selected={selectedAssignees}
          ariaLabel="Assignees"
          placeholder="add assignee"
          labelId="assignedUserIds"
          size="display"
          appearance="inline"
          getOptionLabel={getUserLabel}
          optionKey={(user) => user.id}
          onChange={setAssignedUsers}
        >
          {#snippet selectedContent(user)}
            <span class="inline-flex min-w-0 items-center gap-1" data-assignee-selected-value>
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
      </div>
    </div>

    <div
      use:scrollEditControlOnInteraction
      class="flex items-start gap-3 rounded-lg px-1 py-1"
    >
      <Icon name="notes" size="action" tone="muted" class="mt-2.5 flex-shrink-0" />
      <div class="min-w-0 flex-1">
        <Button
          bind:element={notesTrigger}
          type="button"
          tone="neutral"
          appearance="bare"
          size="display"
          align="between"
          weight="normal"
          aria-label="Notes"
          onclick={openNotesEditor}
          class={notesPreviewButtonClasses}
        >
          <span class="flex min-w-0 flex-1 flex-col items-stretch gap-2">
            <span
              data-testid="item-form-notes-preview"
              class={notesPreviewTextClasses}
            >
              {notes ? notesPreview : 'add note'}
            </span>
            {#if notes}
              <span data-testid="item-form-notes-open-cue" class="text-right text-xs font-medium text-subdued">open</span>
            {/if}
          </span>
        </Button>
      </div>
    </div>
  </div>

  {#if item}
    <ItemAuditMetadata {item} {users} />
  {/if}

  {#if saveError}
    <p class="text-sm text-danger">{saveError}</p>
  {/if}

  {#if notesEditorOpen}
    <div
      use:portal
      role="dialog"
      aria-modal="true"
      aria-labelledby="notes-editor-title"
      class="fixed inset-0 z-50 bg-surface"
    >
      <div class="mx-auto flex min-h-screen max-w-2xl flex-col">
        <div class="grid grid-cols-[1fr_auto_1fr] items-center border-b border-border px-4 py-3">
          <Button
            type="button"
            tone="neutral"
            appearance="bare"
            size="small"
            align="start"
            onclick={cancelNotesEditor}
          >
            <Icon name="back" size="compact" />
            Cancel
          </Button>
          <h2 id="notes-editor-title" class="text-sm font-semibold text-heading">Notes</h2>
          <Button
            type="button"
            tone="primary"
            appearance="bare"
            size="small"
            align="center"
            onclick={saveNotesEditor}
            class="justify-self-end"
          >
            Save
          </Button>
        </div>

        <div class="flex-1 p-4">
          <Textarea
            bind:element={notesTextarea}
            bind:value={notesEditorDraft}
            ariaLabel="Notes"
            placeholder="add note"
            rows={14}
            resize="none"
            appearance="inline"
            onkeydown={handleNotesEditorKeydown}
            class="min-h-[70vh]"
          />
        </div>
      </div>
    </div>
  {/if}
</form>
