<script lang="ts">
  import type { Category, TodoItem, User, RecurrenceRule } from '$lib/mock-data';
  import Button from './Button.svelte';
  import CategorySelect from './CategorySelect.svelte';
  import DatePicker from './DatePicker.svelte';
  import ItemAuditMetadata from './ItemAuditMetadata.svelte';
  import Select from './Select.svelte';
  import StarToggle from './StarToggle.svelte';
  import Textarea from './Textarea.svelte';
  import TextInput from './TextInput.svelte';

  let { item, categories, users }: {
    item: TodoItem;
    categories: Category[];
    users: User[];
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
  const assignedUserIds = $derived(new Set(item.assignedUserIds));
  const recurrencePreset = $derived(getInitialRecurrencePreset(item.recurrenceRule ?? null));
  const notes = $derived(item.notes ?? '');

  function getRecurrenceLabel(preset: string): string {
    return recurrenceOptions.find((option) => option.value === preset)?.label ?? preset;
  }

  function getInitialRecurrencePreset(rule: RecurrenceRule | null): string {
    if (!rule) return '';
    const key = `${rule.intervalValue}_${rule.intervalUnit}`;
    return recurrencePresetOptions.includes(key) ? key : '';
  }
</script>

<article class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
  <div class="flex items-center gap-3">
    <TextInput
      value={item.title}
      disabled
      ariaLabel="Title"
      placeholder="Item title"
      required
      class="w-full"
      containerClass="min-w-0 flex-1"
    />
    <span
      class="flex-shrink-0 text-lg leading-none {item.starred ? 'text-yellow-400' : 'text-gray-200'}"
      aria-label={item.starred ? 'Starred' : 'Not starred'}
    >★</span>
  </div>

  <CategorySelect
    categories={categories}
    selectedCategoryId={item.categoryId}
    label="Category"
    labelId="categoryId"
    disabled
  />

  <DatePicker value={item.dueDate} label="Due Date" disabled />

  <Select
    options={recurrencePresetOptions}
    selected={recurrencePreset}
    label="Recurrence"
    labelId="recurrencePreset"
    getOptionLabel={getRecurrenceLabel}
    disabled
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
            disabled
          >
            {user.name}
          </Button>
        {/each}
      </div>
    {/if}
  </fieldset>

  <Textarea
    value={notes}
    ariaLabel="Notes"
    placeholder="Notes (optional)"
    rows={2}
    resize="none"
    disabled
  />

  <ItemAuditMetadata {item} {users} />
</article>
