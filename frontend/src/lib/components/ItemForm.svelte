<script lang="ts">
  import { untrack, onMount } from 'svelte';
  import type { TodoItem, Category, User, RecurrenceRule } from '$lib/mock-data';
  import DatePicker from './DatePicker.svelte';
  import Select from './Select.svelte';
  import Textarea from './Textarea.svelte';
  import Button from './Button.svelte';
  import TextInput from './TextInput.svelte';

  let {
    item,
    listId,
    categories,
    users,
    onsubmit,
    oncancel,
    defaultCategoryId = ''
  }: {
    item?: TodoItem | null;
    listId: string;
    categories: Category[];
    users: User[];
    onsubmit: (item: TodoItem) => Promise<void> | void;
    oncancel: () => void;
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

  let title = $state(untrack(() => item?.title ?? ''));
  let notes = $state(untrack(() => item?.notes ?? ''));
  let dueDate = $state<string | null>(untrack(() => item?.dueDate ?? null));
  let categoryId = $state<string>(untrack(() => item?.categoryId ?? getEffectiveDefaultCategoryId()));
  let assignedUserIds = $state(new Set<string>(untrack(() => item?.assignedUserIds ?? [])));
  let recurrencePreset = $state<string>(untrack(() => getInitialRecurrencePreset(item?.recurrenceRule ?? null)));
  let titleInput = $state<HTMLInputElement | null>(null);
  let submitting = $state(false);
  let ignoreNextFocusOut = false;

  const categoryOptions = $derived(['', ...categories.map((category) => category.id)]);

  onMount(() => titleInput?.focus());

  function getCategoryLabel(id: string): string {
    if (!id) return 'Uncategorized';
    return categories.find((category) => category.id === id)?.name ?? id;
  }

  function getEffectiveDefaultCategoryId(): string {
    return defaultCategoryId && categories.some((category) => category.id === defaultCategoryId)
      ? defaultCategoryId
      : '';
  }

  function getRecurrenceLabel(preset: string): string {
    return recurrenceOptions.find((option) => option.value === preset)?.label ?? preset;
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

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (submitting) return;
    submitting = true;
    try {
      const now = new Date().toISOString().split('T')[0];
      const submitted: TodoItem = {
        id: item?.id ?? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
        listId,
        categoryId: categoryId || null,
        title,
        notes: notes || null,
        done: item?.done ?? false,
        starred: item?.starred ?? false,
        dueDate,
        assignedUserIds: [...assignedUserIds],
        recurrenceRule: parseRecurrencePreset(recurrencePreset),
        parentItemId: item?.parentItemId ?? null,
        createdByUserId: item?.createdByUserId ?? null,
        sortOrder: item?.sortOrder ?? 999,
        createdAt: item?.createdAt ?? now
      };
      await onsubmit(submitted);
      if (isNew) {
        title = '';
        notes = '';
        dueDate = null;
        categoryId = getEffectiveDefaultCategoryId();
        assignedUserIds = new Set();
        recurrencePreset = '';
        titleInput?.focus();
      }
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
    if (isNew && !e.currentTarget.contains(e.relatedTarget as Node)) oncancel();
  }}
  class="bg-white rounded-xl border border-gray-200 p-4 space-y-3"
>
  <div>
    <TextInput
      bind:element={titleInput}
      bind:value={title}
      onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }}
      placeholder="Item title"
      required
      class="w-full text-sm border-gray-200"
    />
  </div>

    <Select
      options={categoryOptions}
      selected={categoryId}
      label="Category"
      labelId="categoryId"
      getOptionLabel={getCategoryLabel}
      onSelect={(value) => { categoryId = value; }}
    />

    <DatePicker bind:value={dueDate} label="Due Date" />

    <Select
      options={recurrencePresetOptions}
      selected={recurrencePreset}
      label="Recurrence"
      labelId="recurrencePreset"
      getOptionLabel={getRecurrenceLabel}
      onSelect={(value) => { recurrencePreset = value; }}
    />

  <fieldset class="border-0 p-0">
    <legend class="text-xs text-gray-500 mb-1">Assign to</legend>
    {#if users.length === 0}
      <p class="text-xs text-gray-400 italic">No members</p>
    {:else}
      <div class="flex flex-wrap gap-1">
        {#each users as user}
          <Button
            type="button"
            tone="neutral" appearance="outline"
            size="chip"
            selected={assignedUserIds.has(user.id)}
            onclick={() => {
              const next = new Set(assignedUserIds);
              if (next.has(user.id)) {
                next.delete(user.id);
              } else {
                next.add(user.id);
              }
              assignedUserIds = next;
            }}
          >
            {user.name}
          </Button>
        {/each}
      </div>
    {/if}
  </fieldset>

  <Textarea
    bind:value={notes}
    ariaLabel="Notes"
    placeholder="Notes (optional)"
    rows={2}
    resize="none"
  />

  <div class="flex justify-end gap-2 pt-1">
    <Button
      type="button"
      tone="neutral" appearance="bare"
      onclick={oncancel}
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
</form>
