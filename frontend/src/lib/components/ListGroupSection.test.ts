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
  });

  it('keeps personal list ordering available for viewer-role lists', () => {
    const viewerLists = lists.map((list) => ({ ...list, role: 'VIEWER' as const }));
    const { container } = render(ListGroupSection, { props: { group, lists: viewerLists } });

    expect(container.querySelectorAll('[aria-label="Drag to reorder"]')).toHaveLength(viewerLists.length);
    expect(container.querySelector('a[href="/lists/grocery"]')).not.toBeNull();
  });

  it('long-press on list card anchor does not show browser link preview (contextmenu suppressed)', () => {
    const { container } = render(ListGroupSection, { props: { group, lists } });
    const anchor = container.querySelector('a[href]') as HTMLAnchorElement;
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('renders group name', () => {
    const { getAllByText, getByRole } = render(ListGroupSection, { props: { group, lists } });
    expect(getAllByText('Home').length).toBeGreaterThan(0);
    expect(getByRole('button', { name: /home/i })).toHaveClass('justify-start');
  });

  it('renders lists within the group', () => {
    const { getByText } = render(ListGroupSection, { props: { group, lists } });
    expect(getByText('Grocery')).toBeTruthy();
    expect(getByText('Household')).toBeTruthy();
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
    const { getAllByText, getByText, getByRole } = render(ListGroupSection, { props: { group: null, lists: ungrouped } });
    expect(getAllByText('Ungrouped').length).toBeGreaterThan(0);
    expect(getByText('Personal')).toBeTruthy();
    expect(getByRole('button', { name: /ungrouped/i })).toHaveClass('justify-start');
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
});
