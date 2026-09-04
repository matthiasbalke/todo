<script module lang="ts">
  import type { TodoItem, User } from '$lib/mock-data';

  export function formatAuditTimestamp(value: string, timeZone = 'UTC'): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const parts = getDateTimeParts(date, timeZone) ?? getDateTimeParts(date, 'UTC');
    if (!parts) return value;

    return `${withTrailingPeriod(parts.weekday)} ${parts.day}. ${parts.month} ${parts.year} at ${parts.hour}:${parts.minute}`;
  }

  function getDateTimeParts(date: Date, timeZone: string) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      });
      const parts = Object.fromEntries(
        formatter.formatToParts(date).map((part) => [part.type, part.value])
      );
      return {
        weekday: parts.weekday ?? '',
        day: parts.day ?? '',
        month: parts.month ?? '',
        year: parts.year ?? '',
        hour: parts.hour ?? '',
        minute: parts.minute ?? ''
      };
    } catch {
      return null;
    }
  }

  function withTrailingPeriod(value: string): string {
    return value.endsWith('.') ? value : `${value}.`;
  }
</script>

<script lang="ts">
  import { getProfile } from '$lib/stores/preferences.svelte';

  let { item, users }: {
    item: TodoItem;
    users: User[];
  } = $props();

  const timeZone = $derived(getProfile()?.timeZone ?? 'UTC');

  function displayName(userId: string | null): string {
    if (!userId) return 'Deleted user';
    return users.find((user) => user.id === userId)?.name ?? 'Deleted user';
  }
</script>

<div class="space-y-1 text-center text-xs text-gray-500" data-testid="item-audit-metadata">
  <p>
    <time datetime={item.updatedAt}>{formatAuditTimestamp(item.updatedAt, timeZone)}</time>
    updated by {displayName(item.updatedByUserId)}
  </p>
  <p>
    <time datetime={item.createdAt}>{formatAuditTimestamp(item.createdAt, timeZone)}</time>
    created by {displayName(item.createdByUserId)}
  </p>
</div>
