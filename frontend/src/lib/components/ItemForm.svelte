<script lang="ts">
  import type { TodoItem, Category, User, Priority, RecurrenceRule } from '$lib/mock-data';

  let {
    item,
    listId,
    categories,
    users,
    onsubmit,
    oncancel
  }: {
    item?: TodoItem | null;
    listId: string;
    categories: Category[];
    users: User[];
    onsubmit: (item: TodoItem) => void;
    oncancel: () => void;
  } = $props();

  const isNew = !item;

  let title = $state(item?.title ?? '');
  let notes = $state(item?.notes ?? '');
  let priority = $state<Priority | ''>(item?.priority ?? '');
  let dueDate = $state(item?.dueDate ?? '');
  let categoryId = $state<string>(item?.categoryId ?? '');
  let assignedUserId = $state<string>(item?.assignedUserId ?? '');
  let recurrencePreset = $state<string>(getInitialRecurrencePreset(item?.recurrenceRule ?? null));
  let titleInput = $state<HTMLInputElement | null>(null);

  function getInitialRecurrencePreset(rule: RecurrenceRule | null): string {
    if (!rule) return '';
    const key = `${rule.intervalValue}_${rule.intervalUnit}`;
    const valid = ['1_DAYS','1_WEEKS','2_WEEKS','1_MONTHS','3_MONTHS','1_YEARS'];
    return valid.includes(key) ? key : '';
  }

  function parseRecurrencePreset(preset: string): RecurrenceRule | null {
    if (!preset) return null;
    const [val, unit] = preset.split('_');
    return { intervalValue: parseInt(val), intervalUnit: unit as RecurrenceRule['intervalUnit'] };
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    const now = new Date().toISOString().split('T')[0];
    const submitted: TodoItem = {
      id: item?.id ?? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
      listId,
      categoryId: categoryId || null,
      title,
      notes: notes || null,
      done: item?.done ?? false,
      starred: item?.starred ?? false,
      priority: (priority as Priority) || null,
      dueDate: dueDate || null,
      assignedUserId: assignedUserId || null,
      recurrenceRule: parseRecurrencePreset(recurrencePreset),
      parentItemId: item?.parentItemId ?? null,
      sortOrder: item?.sortOrder ?? 999,
      createdAt: item?.createdAt ?? now
    };
    onsubmit(submitted);
    if (isNew) {
      title = '';
      notes = '';
      priority = '';
      dueDate = '';
      categoryId = '';
      assignedUserId = '';
      recurrencePreset = '';
      titleInput?.focus();
    }
  }
</script>

<form onsubmit={handleSubmit} class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
  <div>
    <input
      type="text"
      bind:this={titleInput}
      bind:value={title}
      onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }}
      placeholder="Item title"
      required
      class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div>
    <textarea
      bind:value={notes}
      placeholder="Notes (optional)"
      rows="2"
      class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    ></textarea>
  </div>

  <div class="grid grid-cols-2 gap-2">
    <div>
      <label class="text-xs text-gray-500 mb-1 block">Priority</label>
      <select
        bind:value={priority}
        class="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">None</option>
        <option value="URGENT">Urgent</option>
        <option value="HIGH">High</option>
        <option value="NORMAL">Normal</option>
        <option value="LOW">Low</option>
      </select>
    </div>

    <div>
      <label class="text-xs text-gray-500 mb-1 block">Due Date</label>
      <input
        type="date"
        bind:value={dueDate}
        class="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label class="text-xs text-gray-500 mb-1 block">Category</label>
      <select
        bind:value={categoryId}
        class="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Uncategorized</option>
        {#each categories as cat}
          <option value={cat.id}>{cat.name}</option>
        {/each}
      </select>
    </div>

    <div>
      <label class="text-xs text-gray-500 mb-1 block">Assign to</label>
      <select
        bind:value={assignedUserId}
        class="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Unassigned</option>
        {#each users as user}
          <option value={user.id}>{user.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <div>
    <label class="text-xs text-gray-500 mb-1 block">Recurrence</label>
    <select
      bind:value={recurrencePreset}
      class="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">No recurrence</option>
      <option value="1_DAYS">Every day</option>
      <option value="1_WEEKS">Every week</option>
      <option value="2_WEEKS">Every 2 weeks</option>
      <option value="1_MONTHS">Every month</option>
      <option value="3_MONTHS">Every 3 months</option>
      <option value="1_YEARS">Every year</option>
    </select>
  </div>

  <div class="flex justify-end gap-2 pt-1">
    <button
      type="button"
      onclick={oncancel}
      class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
    >
      Cancel
    </button>
    <button
      type="submit"
      class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      {isNew ? 'Add' : 'Save'}
    </button>
  </div>
</form>
