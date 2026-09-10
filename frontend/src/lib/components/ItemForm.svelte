<script module lang="ts">
  export interface ItemFormDraft {
    title: string;
    notes: string;
    dueDate: string | null;
    categoryId: string | null;
    assignedUserIds: string[];
    recurrencePreset: string;
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
  import Select from './Select.svelte';
  import StarToggle from './StarToggle.svelte';
  import Textarea from './Textarea.svelte';
  import Button from './Button.svelte';
  import { controlPlaceholderTextClasses, controlValueTextClasses } from './controlStyles';
  import TextInput from './TextInput.svelte';

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

  const recurrenceOptions = [
    { value: '', label: 'No recurrence' },
    { value: '1_DAYS', label: 'Every day' },
    { value: '1_WEEKS', label: 'Every week' },
    { value: '2_WEEKS', label: 'Every 2 weeks' },
    { value: '1_MONTHS', label: 'Every month' },
    { value: '3_MONTHS', label: 'Every 3 months' },
    { value: '1_YEARS', label: 'Every year' }
  ];
  const recurrencePresetOptions = recurrenceOptions.map((option) => option.value);

  const isNew = $derived(!item);

  let title = $state(untrack(() => item?.title ?? draft?.title ?? ''));
  let notes = $state(untrack(() => item?.notes ?? draft?.notes ?? ''));
  let dueDate = $state<string | null>(untrack(() => item?.dueDate ?? draft?.dueDate ?? null));
  let categoryId = $state<string | null>(untrack(() => item?.categoryId ?? draft?.categoryId ?? getEffectiveDefaultCategoryId()));
  let assignedUserIds = $state(new Set<string>(untrack(() => item?.assignedUserIds ?? draft?.assignedUserIds ?? [])));
  let recurrencePreset = $state<string>(untrack(() => item ? getInitialRecurrencePreset(item.recurrenceRule ?? null) : draft?.recurrencePreset ?? ''));
  let done = $state(untrack(() => item?.done ?? draft?.done ?? false));
  let starred = $state(untrack(() => item?.starred ?? draft?.starred ?? false));
  let titleInput = $state<HTMLInputElement | null>(null);
  let notesTrigger = $state<HTMLButtonElement | null>(null);
  let notesTextarea = $state<HTMLTextAreaElement | null>(null);
  let notesEditorOpen = $state(false);
  let notesEditorDraft = $state('');
  let submitting = $state(false);
  let ignoreNextFocusOut = false;
  let suppressNextDraftChange = false;

  onMount(() => titleInput?.focus());

  function getEffectiveDefaultCategoryId(): string | null {
    return defaultCategoryId && categories.some((category) => category.id === defaultCategoryId)
      ? defaultCategoryId
      : null;
  }

  function getRecurrenceLabel(preset: string): string {
    return recurrenceOptions.find((option) => option.value === preset)?.label ?? preset;
  }

  function getRecurrenceFormLabel(preset: string): string {
    return preset ? getRecurrenceLabel(preset) : 'set recurrence';
  }

  function isRecurrenceMuted(preset: string): boolean {
    return !preset;
  }

  function getInitialRecurrencePreset(rule: RecurrenceRule | null): string {
    if (!rule) return '';
    const key = `${rule.intervalValue}_${rule.intervalUnit}`;
    return recurrencePresetOptions.includes(key) ? key : '';
  }

  function parseRecurrencePreset(preset: string): RecurrenceRule | null {
    if (!preset) return null;
    const [val, unit] = preset.split('_');
    return { intervalValue: parseInt(val), intervalUnit: unit as RecurrenceRule['intervalUnit'] };
  }

  function currentDraft(): ItemFormDraft {
    return {
      title,
      notes,
      dueDate,
      categoryId,
      assignedUserIds: [...assignedUserIds],
      recurrencePreset,
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
    recurrencePreset = '';
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

  function closeNotesEditor({ returnFocus = true }: { returnFocus?: boolean } = {}) {
    notesEditorOpen = false;
    if (returnFocus) {
      tick().then(() => notesTrigger?.focus());
    }
  }

  function saveNotesEditor() {
    notes = notesEditorDraft;
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
      await onDoneChange?.(nextDone);
    } catch {
      done = !nextDone;
    }
  }

  async function toggleStarredState() {
    const nextStarred = !starred;
    starred = nextStarred;
    try {
      await onStarredChange?.(nextStarred);
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

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (submitting) return;
    submitting = true;
    try {
      const now = new Date().toISOString().split('T')[0];
      const submitted: TodoItem = {
        id: item?.id ?? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
        listId,
        categoryId,
        title,
        notes: notes || null,
        done,
        starred,
        dueDate,
        assignedUserIds: [...assignedUserIds],
        recurrenceRule: parseRecurrencePreset(recurrencePreset),
        parentItemId: item?.parentItemId ?? null,
        createdByUserId: item?.createdByUserId ?? null,
        updatedByUserId: item?.updatedByUserId ?? null,
        sortOrder: item?.sortOrder ?? 999,
        createdAt: item?.createdAt ?? now,
        updatedAt: item?.updatedAt ?? now
      };
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
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
  onsubmit={handleSubmit}
  onmousedown={() => {
    ignoreNextFocusOut = true;
    setTimeout(() => { ignoreNextFocusOut = false; }, 0);
  }}
  onfocusout={(e) => {
    if (submitting) return;
    if (ignoreNextFocusOut) { ignoreNextFocusOut = false; return; }
    if (isNew && !e.currentTarget.contains(e.relatedTarget as Node)) oncancel({ reason: 'focusout' });
  }}
  class="bg-white rounded-xl border border-gray-200 p-4 space-y-4"
>
  <div class="flex items-center gap-2">
    <CompletionToggle size="form" {done} onactivate={toggleDoneState} />
    <TextInput
      bind:element={titleInput}
      bind:value={title}
      onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }}
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
    <div class="flex items-start gap-3 rounded-lg px-1 py-1">
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

    <div class="flex items-start gap-3 rounded-lg px-1 py-1">
      <Icon name="date" size="action" tone="muted" class="mt-3 flex-shrink-0" />
      <div class="min-w-0 flex-1">
        <DatePicker bind:value={dueDate} ariaLabel="Due Date" placeholder="set due date" appearance="inline" />
      </div>
    </div>

    <div class="flex items-start gap-3 rounded-lg px-1 py-1">
      <Icon name="recurrence" size="action" tone="muted" class="mt-3 flex-shrink-0" />
      <div class="min-w-0 flex-1">
    <Select
      options={recurrencePresetOptions}
      selected={recurrencePreset}
          ariaLabel="Recurrence"
          placeholder="set recurrence"
      labelId="recurrencePreset"
          size="display"
          appearance="inline"
          getOptionLabel={getRecurrenceLabel}
          getSelectedLabel={getRecurrenceFormLabel}
          isSelectedMuted={isRecurrenceMuted}
      onSelect={(value) => { recurrencePreset = value; }}
    />
      </div>
    </div>

    <div class="flex items-start gap-3 rounded-lg px-1 py-1">
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
            <span class="inline-flex min-w-0 items-center gap-1">
              <span class="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700" aria-hidden="true">
                {getUserInitial(user)}
              </span>
              <span class="truncate">{getUserLabel(user)}</span>
            </span>
          {/snippet}

          {#snippet optionContent(user)}
            <span class="inline-flex min-w-0 items-center gap-2">
              <span class="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600" aria-hidden="true">
                {getUserInitial(user)}
              </span>
              <span class="min-w-0 truncate">{getUserLabel(user)}</span>
            </span>
          {/snippet}
        </MultiSelect>
      </div>
    </div>

    <div class="flex items-start gap-3 rounded-lg px-1 py-1">
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
              <span data-testid="item-form-notes-open-cue" class="text-right text-xs font-medium text-gray-400">open</span>
            {/if}
          </span>
        </Button>
      </div>
    </div>
  </div>

  {#if item}
    <ItemAuditMetadata {item} {users} />
  {/if}

  <div class="flex justify-end gap-2 pt-1">
    <Button
      type="button"
      tone="neutral" appearance="bare"
      onclick={() => { oncancel({ reason: 'explicit' }); }}
      emphasis="muted"
    >
      Cancel
    </Button>
    <Button
      type="submit"
      loading={submitting}
      loadingLabel={isNew ? 'Adding…' : 'Saving…'}
    >
      {isNew ? 'Add' : 'Save'}
    </Button>
  </div>

  {#if notesEditorOpen}
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notes-editor-title"
      class="fixed inset-0 z-50 bg-white"
    >
      <div class="mx-auto flex min-h-screen max-w-2xl flex-col">
        <div class="grid grid-cols-[1fr_auto_1fr] items-center border-b border-gray-200 px-4 py-3">
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
          <h2 id="notes-editor-title" class="text-sm font-semibold text-gray-900">Notes</h2>
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
