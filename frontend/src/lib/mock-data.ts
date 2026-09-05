export type SortField = 'ALPHA' | 'DUE_DATE' | 'STARRED' | 'CREATED' | 'MANUAL';
export type SortDirection = 'ASC' | 'DESC';
export type IntervalUnit = 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS';
import type { ListRole } from '$lib/api/lists';

export interface RecurrenceRule {
  intervalUnit: IntervalUnit;
  intervalValue: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface List {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  defaultSortField: SortField;
  defaultSortDirection: SortDirection;
  createdAt: string;
  groupId: string | null;
  sortOrderInGroup: number;
  role: ListRole;
}

export interface ListGroup {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface Category {
  id: string;
  listId: string;
  name: string;
  color: string | null;
  sortOrder: number;
}

export interface TodoItem {
  id: string;
  listId: string;
  categoryId: string | null;
  title: string;
  notes: string | null;
  done: boolean;
  starred: boolean;
  dueDate: string | null; // ISO date string
  assignedUserIds: string[];
  recurrenceRule: RecurrenceRule | null;
  parentItemId: string | null;
  createdByUserId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const mockUsers: User[] = [
  { id: 'u1', name: 'Matthias', email: 'matthias@example.com' },
  { id: 'u2', name: 'Anna', email: 'anna@example.com' }
];

export const mockListGroups: ListGroup[] = [
  { id: 'group-home', userId: 'u1', name: 'Home', sortOrder: 0, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'group-work', userId: 'u1', name: 'Work', sortOrder: 1, createdAt: '2024-01-01T00:00:00Z' },
];

export const mockLists: List[] = [
  { id: 'grocery', name: 'Grocery', emoji: '🛒', description: null, defaultSortField: 'MANUAL', defaultSortDirection: 'ASC', createdAt: '2024-01-01T00:00:00Z', groupId: 'group-home', sortOrderInGroup: 0, role: 'OWNER' },
  { id: 'household', name: 'Household', emoji: '🏠', description: null, defaultSortField: 'DUE_DATE', defaultSortDirection: 'ASC', createdAt: '2024-01-01T00:00:00Z', groupId: 'group-home', sortOrderInGroup: 1, role: 'OWNER' },
  { id: 'personal', name: 'Personal', emoji: '📋', description: null, defaultSortField: 'STARRED', defaultSortDirection: 'DESC', createdAt: '2024-01-01T00:00:00Z', groupId: null, sortOrderInGroup: 0, role: 'OWNER' }
];

export const mockCategories: Category[] = [
  // Grocery categories
  { id: 'c-produce', listId: 'grocery', name: 'Produce', color: null, sortOrder: 1 },
  { id: 'c-dairy', listId: 'grocery', name: 'Dairy', color: null, sortOrder: 2 },
  { id: 'c-bakery', listId: 'grocery', name: 'Bakery', color: null, sortOrder: 3 },
  { id: 'c-meat', listId: 'grocery', name: 'Meat', color: null, sortOrder: 4 },
  // Household categories
  { id: 'c-cleaning', listId: 'household', name: 'Cleaning', color: null, sortOrder: 1 },
  { id: 'c-maintenance', listId: 'household', name: 'Maintenance', color: null, sortOrder: 2 },
  // Personal categories
  { id: 'c-health', listId: 'personal', name: 'Health', color: null, sortOrder: 1 },
  { id: 'c-finance', listId: 'personal', name: 'Finance', color: null, sortOrder: 2 }
];

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
const nextWeekStr = nextWeek.toISOString().split('T')[0];
const lastMonth = new Date(today); lastMonth.setMonth(today.getMonth() - 1);
const lastMonthStr = lastMonth.toISOString().split('T')[0];

export const mockItems: TodoItem[] = [
  // Grocery - Produce
  { id: 'i1', listId: 'grocery', categoryId: 'c-produce', title: 'Apples', notes: 'Get Braeburn if available', done: false, starred: true, dueDate: todayStr, assignedUserIds: ['u1'], recurrenceRule: null, parentItemId: null, createdByUserId: 'u1', sortOrder: 1, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  { id: 'i2', listId: 'grocery', categoryId: 'c-produce', title: 'Bananas', notes: null, done: true, starred: false, dueDate: null, assignedUserIds: [], recurrenceRule: null, parentItemId: null, createdByUserId: 'u1', sortOrder: 2, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  { id: 'i3', listId: 'grocery', categoryId: 'c-produce', title: 'Spinach', notes: null, done: false, starred: false, dueDate: null, assignedUserIds: [], recurrenceRule: null, parentItemId: null, createdByUserId: 'u2', sortOrder: 3, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  // Grocery - Dairy
  { id: 'i4', listId: 'grocery', categoryId: 'c-dairy', title: 'Whole Milk', notes: null, done: false, starred: false, dueDate: yesterdayStr, assignedUserIds: ['u2'], recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 1 }, parentItemId: null, createdByUserId: 'u1', sortOrder: 1, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  { id: 'i5', listId: 'grocery', categoryId: 'c-dairy', title: 'Greek Yogurt', notes: null, done: true, starred: false, dueDate: null, assignedUserIds: [], recurrenceRule: null, parentItemId: null, createdByUserId: 'u2', sortOrder: 2, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  { id: 'i6', listId: 'grocery', categoryId: 'c-dairy', title: 'Cheddar Cheese', notes: null, done: false, starred: true, dueDate: nextWeekStr, assignedUserIds: [], recurrenceRule: null, parentItemId: null, createdByUserId: 'u1', sortOrder: 3, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  // Grocery - Bakery
  { id: 'i7', listId: 'grocery', categoryId: 'c-bakery', title: 'Sourdough Bread', notes: null, done: false, starred: false, dueDate: todayStr, assignedUserIds: [], recurrenceRule: null, parentItemId: null, createdByUserId: 'u1', sortOrder: 1, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  // Grocery - uncategorized
  { id: 'i8', listId: 'grocery', categoryId: null, title: 'Olive Oil', notes: 'Extra virgin, cold pressed', done: false, starred: false, dueDate: null, assignedUserIds: [], recurrenceRule: null, parentItemId: null, createdByUserId: 'u1', sortOrder: 1, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  // Household - Cleaning
  { id: 'i9', listId: 'household', categoryId: 'c-cleaning', title: 'Clean bathrooms', notes: null, done: true, starred: false, dueDate: yesterdayStr, assignedUserIds: ['u1'], recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 2 }, parentItemId: null, createdByUserId: 'u1', sortOrder: 1, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  { id: 'i10', listId: 'household', categoryId: 'c-cleaning', title: 'Vacuum living room', notes: null, done: false, starred: false, dueDate: todayStr, assignedUserIds: [], recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 1 }, parentItemId: null, createdByUserId: 'u1', sortOrder: 2, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  { id: 'i11', listId: 'household', categoryId: 'c-cleaning', title: 'Mop kitchen floor', notes: null, done: false, starred: false, dueDate: nextWeekStr, assignedUserIds: [], recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 2 }, parentItemId: null, createdByUserId: 'u2', sortOrder: 3, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  // Household - Maintenance
  { id: 'i12', listId: 'household', categoryId: 'c-maintenance', title: 'Replace HVAC filter', notes: 'Use MERV-11 or higher', done: false, starred: true, dueDate: yesterdayStr, assignedUserIds: [], recurrenceRule: { intervalUnit: 'MONTHS', intervalValue: 3 }, parentItemId: null, createdByUserId: 'u1', sortOrder: 1, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  { id: 'i13', listId: 'household', categoryId: 'c-maintenance', title: 'Check smoke detectors', notes: null, done: false, starred: false, dueDate: nextWeekStr, assignedUserIds: ['u1'], recurrenceRule: { intervalUnit: 'MONTHS', intervalValue: 6 }, parentItemId: null, createdByUserId: 'u1', sortOrder: 2, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  // Personal - Health
  { id: 'i14', listId: 'personal', categoryId: 'c-health', title: 'Schedule dentist appointment', notes: null, done: false, starred: false, dueDate: nextWeekStr, assignedUserIds: [], recurrenceRule: { intervalUnit: 'MONTHS', intervalValue: 6 }, parentItemId: null, createdByUserId: 'u1', sortOrder: 1, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  { id: 'i15', listId: 'personal', categoryId: 'c-health', title: 'Morning run', notes: 'At least 5km', done: true, starred: true, dueDate: todayStr, assignedUserIds: [], recurrenceRule: { intervalUnit: 'DAYS', intervalValue: 1 }, parentItemId: null, createdByUserId: 'u1', sortOrder: 2, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  // Personal - Finance
  { id: 'i16', listId: 'personal', categoryId: 'c-finance', title: 'Review monthly budget', notes: null, done: false, starred: false, dueDate: nextWeekStr, assignedUserIds: [], recurrenceRule: { intervalUnit: 'MONTHS', intervalValue: 1 }, parentItemId: null, createdByUserId: 'u1', sortOrder: 1, createdAt: lastMonthStr, updatedAt: lastMonthStr },
  // Personal - uncategorized
  { id: 'i17', listId: 'personal', categoryId: null, title: 'Read book', notes: 'Currently reading: The Pragmatic Programmer', done: false, starred: false, dueDate: null, assignedUserIds: [], recurrenceRule: null, parentItemId: null, createdByUserId: 'u1', sortOrder: 1, createdAt: lastMonthStr, updatedAt: lastMonthStr }
];
