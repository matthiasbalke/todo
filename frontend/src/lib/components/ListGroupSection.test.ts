import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ListGroupSection from './ListGroupSection.svelte';
import type { List, ListGroup } from '$lib/mock-data';

vi.mock('$lib/stores/lists.svelte', () => ({
  renameListGroup: vi.fn(),
  deleteListGroup: vi.fn(),
  assignListGroup: vi.fn(),
  reorderListInGroup: vi.fn(),
}));

vi.mock('$lib/stores/drag.svelte', () => ({
  isDraggingAny: vi.fn(() => false),
  setDraggingAny: vi.fn(),
}));

vi.mock('svelte-dnd-action', () => ({
  dragHandleZone: (_node: HTMLElement, _options: Record<string, unknown>) => {
    return { update: () => {}, destroy: () => {} };
  },
  dragHandle: () => ({ destroy: () => {} }),
  SHADOW_ITEM_MARKER_PROPERTY_NAME: '__shadow__',
}));

const group: ListGroup = {
  id: 'group-home',
  userId: 'u1',
  name: 'Home',
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00Z',
};

const lists: List[] = [
  {
    id: 'grocery',
    name: 'Grocery',
    emoji: '🛒',
    description: null,
    defaultSortField: 'MANUAL',
    defaultSortDirection: 'ASC',
    createdAt: '2024-01-01T00:00:00Z',
    groupId: 'group-home',
    sortOrderInGroup: 0,
    role: 'OWNER',
  },
  {
    id: 'household',
    name: 'Household',
    emoji: '🏠',
    description: null,
    defaultSortField: 'DUE_DATE',
    defaultSortDirection: 'ASC',
    createdAt: '2024-01-01T00:00:00Z',
    groupId: 'group-home',
    sortOrderInGroup: 1,
    role: 'OWNER',
  },
];

describe('ListGroupSection', () => {
  it('each list card renders a drag handle for touch-friendly dragging', () => {
    const { container } = render(ListGroupSection, { props: { group, lists } });
    const handles = container.querySelectorAll('[aria-label="Drag to reorder"]');
    expect(handles.length).toBe(lists.length);
    expect(handles[0]?.querySelector('svg')).not.toBeNull();
    expect(handles[0]?.querySelector('svg')).toHaveClass('lucide-grip-vertical');
  });

  it('keeps personal list ordering available for viewer-role lists', () => {
    const viewerLists = lists.map((list) => ({ ...list, role: 'VIEWER' as const }));
    const { container } = render(ListGroupSection, { props: { group, lists: viewerLists } });

    expect(container.querySelectorAll('[aria-label="Drag to reorder"]')).toHaveLength(viewerLists.length);
    expect(container.querySelector('a[href="/lists/grocery"]')).not.toBeNull();
  });

  it('renders a separate list group drag handle only when requested', () => {
    const grouped = render(ListGroupSection, { props: { group, lists, showGroupDragHandle: true } });
    expect(grouped.container.querySelectorAll('[aria-label="Drag to reorder list group"]')).toHaveLength(1);
    expect(grouped.container.querySelector('[aria-label="Drag to reorder list group"] svg')).toHaveClass('lucide-grip-vertical');
    expect(grouped.container.querySelectorAll('[aria-label="Drag to reorder"]')).toHaveLength(lists.length);

    const ungrouped = render(ListGroupSection, { props: { group: null, lists, showGroupDragHandle: true } });
    expect(ungrouped.container.querySelector('[aria-label="Drag to reorder list group"]')).toBeNull();
  });

  it('long-press on list card anchor does not show browser link preview (contextmenu suppressed)', () => {
    const { container } = render(ListGroupSection, { props: { group, lists } });
    const anchor = container.querySelector('a[href]') as HTMLAnchorElement;
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('renders group name', () => {
    const { container, getAllByText, getByRole } = render(ListGroupSection, { props: { group, lists } });
    expect(getAllByText('Home').length).toBeGreaterThan(0);
    expect(getByRole('button', { name: /home/i })).toHaveClass('justify-start');
    expect(container.querySelectorAll('button[aria-expanded="true"] svg')).toHaveLength(2);
  });

  it('places group options before the collapse chevron without toggling collapse', async () => {
    const oncollapsedchange = vi.fn();
    const { container, getByRole } = render(ListGroupSection, {
      props: { group, lists, collapsed: false, oncollapsedchange },
    });

    const groupOptions = getByRole('button', { name: 'Group options' });
    const collapseChevron = getByRole('button', { name: 'Collapse section' });

    expect(groupOptions.querySelector('svg')).toHaveClass('lucide-ellipsis');
    expect(
      groupOptions.compareDocumentPosition(collapseChevron) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    await fireEvent.click(groupOptions);

    expect(oncollapsedchange).not.toHaveBeenCalled();
    expect(getByRole('button', { name: 'Rename' })).toBeInTheDocument();
    expect(container.querySelectorAll('a[href]')).toHaveLength(lists.length);
  });

  it('renders lists within the group', () => {
    const { container, getByText } = render(ListGroupSection, { props: { group, lists } });
    expect(getByText('Grocery')).toBeTruthy();
    expect(getByText('Household')).toBeTruthy();
    expect(container.querySelectorAll('a[href] svg')).toHaveLength(lists.length);
    expect(container.textContent).not.toContain('›');
  });

  it('renders lists in sortOrderInGroup order', () => {
    const { container } = render(ListGroupSection, { props: { group, lists } });
    const anchors = container.querySelectorAll('a[href]');
    const hrefs = Array.from(anchors).map(a => a.getAttribute('href'));
    expect(hrefs[0]).toBe('/lists/grocery');
    expect(hrefs[1]).toBe('/lists/household');
  });

  it('renders ungrouped section label when group is null', () => {
    const ungrouped: List[] = [
      {
        id: 'personal',
        name: 'Personal',
        emoji: '📋',
        description: null,
        defaultSortField: 'STARRED',
        defaultSortDirection: 'DESC',
        createdAt: '2024-01-01T00:00:00Z',
        groupId: null,
        sortOrderInGroup: 0,
        role: 'OWNER',
      },
    ];
    const { container, getAllByText, getByText, getByRole } = render(ListGroupSection, { props: { group: null, lists: ungrouped } });
    expect(getAllByText('Ungrouped').length).toBeGreaterThan(0);
    expect(getByText('Personal')).toBeTruthy();
    expect(getByRole('button', { name: /ungrouped/i })).toHaveClass('justify-start');
    expect(getByRole('button', { name: 'Collapse section' })).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Group options"]')).toBeNull();
  });

  it('ungrouped section is collapsible', async () => {
    const { container, getByRole } = render(ListGroupSection, { props: { group: null, lists } });
    // Initially expanded
    expect(container.querySelectorAll('a[href]').length).toBe(lists.length);
    // Collapse
    const toggleBtn = getByRole('button', { name: /ungrouped/i });
    await fireEvent.click(toggleBtn);
    expect(container.querySelectorAll('a[href]').length).toBe(0);
  });

  it('grouped section is collapsible', async () => {
    const { container, getByRole } = render(ListGroupSection, { props: { group, lists } });
    expect(container.querySelectorAll('a[href]').length).toBe(lists.length);
    const toggleBtn = getByRole('button', { name: /home/i });
    await fireEvent.click(toggleBtn);
    expect(container.querySelectorAll('a[href]').length).toBe(0);
  });

  it('uses controlled collapsed state when provided', () => {
    const { container, getByRole } = render(ListGroupSection, { props: { group, lists, collapsed: true } });

    expect(getByRole('button', { name: /home/i })).toHaveAttribute('aria-expanded', 'false');
    expect(getByRole('button', { name: /home/i }).querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('a[href]')).toHaveLength(0);
  });

  it('calls collapse change callback without mutating controlled state by itself', async () => {
    const oncollapsedchange = vi.fn();
    const { container, getByRole, rerender } = render(ListGroupSection, {
      props: { group, lists, collapsed: false, oncollapsedchange },
    });

    const toggleBtn = getByRole('button', { name: /home/i });
    await fireEvent.click(toggleBtn);

    expect(oncollapsedchange).toHaveBeenCalledWith(true);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelectorAll('a[href]')).toHaveLength(lists.length);

    await rerender({ group, lists, collapsed: true, oncollapsedchange });

    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelectorAll('a[href]')).toHaveLength(0);
  });
});
