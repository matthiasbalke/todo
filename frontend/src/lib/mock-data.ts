export type Priority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
export type SortField = 'ALPHA' | 'DUE_DATE' | 'STARRED' | 'CREATED' | 'MANUAL';
export type SortDirection = 'ASC' | 'DESC';
export type IntervalUnit = 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS';

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
  emoji: string;
  sortField: SortField;
  sortDirection: SortDirection;
  ownerId: string;
}

export interface Category {
  id: string;
  listId: string;
  name: string;
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
  priority: Priority | null;
  dueDate: string | null; // ISO date string
  assignedUserId: string | null;
  recurrenceRule: RecurrenceRule | null;
  parentItemId: string | null;
  sortOrder: number;
  createdAt: string;
}

export const mockUsers: User[] = [
  { id: 'u1', name: 'Matthias', email: 'matthias@example.com' },
  { id: 'u2', name: 'Anna', email: 'anna@example.com' }
];

export const mockLists: List[] = [
  { id: 'grocery', name: 'Grocery', emoji: '🛒', sortField: 'MANUAL', sortDirection: 'ASC', ownerId: 'u1' },
  { id: 'household', name: 'Household', emoji: '🏠', sortField: 'DUE_DATE', sortDirection: 'ASC', ownerId: 'u1' },
  { id: 'personal', name: 'Personal', emoji: '📋', sortField: 'STARRED', sortDirection: 'DESC', ownerId: 'u1' }
];

export const mockCategories: Category[] = [
  // Grocery categories
  { id: 'c-produce', listId: 'grocery', name: 'Produce', sortOrder: 1 },
  { id: 'c-dairy', listId: 'grocery', name: 'Dairy', sortOrder: 2 },
  { id: 'c-bakery', listId: 'grocery', name: 'Bakery', sortOrder: 3 },
  { id: 'c-meat', listId: 'grocery', name: 'Meat', sortOrder: 4 },
  // Household categories
  { id: 'c-cleaning', listId: 'household', name: 'Cleaning', sortOrder: 1 },
  { id: 'c-maintenance', listId: 'household', name: 'Maintenance', sortOrder: 2 },
  // Personal categories
  { id: 'c-health', listId: 'personal', name: 'Health', sortOrder: 1 },
  { id: 'c-finance', listId: 'personal', name: 'Finance', sortOrder: 2 }
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
  { id: 'i1', listId: 'grocery', categoryId: 'c-produce', title: 'Apples', notes: 'Get Braeburn if available', done: false, starred: true, priority: 'NORMAL', dueDate: todayStr, assignedUserId: 'u1', recurrenceRule: null, parentItemId: null, sortOrder: 1, createdAt: lastMonthStr },
  { id: 'i2', listId: 'grocery', categoryId: 'c-produce', title: 'Bananas', notes: null, done: true, starred: false, priority: 'LOW', dueDate: null, assignedUserId: null, recurrenceRule: null, parentItemId: null, sortOrder: 2, createdAt: lastMonthStr },
  { id: 'i3', listId: 'grocery', categoryId: 'c-produce', title: 'Spinach', notes: null, done: false, starred: false, priority: null, dueDate: null, assignedUserId: null, recurrenceRule: null, parentItemId: null, sortOrder: 3, createdAt: lastMonthStr },
  // Grocery - Dairy
  { id: 'i4', listId: 'grocery', categoryId: 'c-dairy', title: 'Whole Milk', notes: null, done: false, starred: false, priority: 'HIGH', dueDate: yesterdayStr, assignedUserId: 'u2', recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 1 }, parentItemId: null, sortOrder: 1, createdAt: lastMonthStr },
  { id: 'i5', listId: 'grocery', categoryId: 'c-dairy', title: 'Greek Yogurt', notes: null, done: true, starred: false, priority: 'NORMAL', dueDate: null, assignedUserId: null, recurrenceRule: null, parentItemId: null, sortOrder: 2, createdAt: lastMonthStr },
  { id: 'i6', listId: 'grocery', categoryId: 'c-dairy', title: 'Cheddar Cheese', notes: null, done: false, starred: true, priority: null, dueDate: nextWeekStr, assignedUserId: null, recurrenceRule: null, parentItemId: null, sortOrder: 3, createdAt: lastMonthStr },
  // Grocery - Bakery
  { id: 'i7', listId: 'grocery', categoryId: 'c-bakery', title: 'Sourdough Bread', notes: null, done: false, starred: false, priority: 'URGENT', dueDate: todayStr, assignedUserId: null, recurrenceRule: null, parentItemId: null, sortOrder: 1, createdAt: lastMonthStr },
  // Grocery - uncategorized
  { id: 'i8', listId: 'grocery', categoryId: null, title: 'Olive Oil', notes: 'Extra virgin, cold pressed', done: false, starred: false, priority: 'LOW', dueDate: null, assignedUserId: null, recurrenceRule: null, parentItemId: null, sortOrder: 1, createdAt: lastMonthStr },
  // Household - Cleaning
  { id: 'i9', listId: 'household', categoryId: 'c-cleaning', title: 'Clean bathrooms', notes: null, done: true, starred: false, priority: 'HIGH', dueDate: yesterdayStr, assignedUserId: 'u1', recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 2 }, parentItemId: null, sortOrder: 1, createdAt: lastMonthStr },
  { id: 'i10', listId: 'household', categoryId: 'c-cleaning', title: 'Vacuum living room', notes: null, done: false, starred: false, priority: 'NORMAL', dueDate: todayStr, assignedUserId: null, recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 1 }, parentItemId: null, sortOrder: 2, createdAt: lastMonthStr },
  { id: 'i11', listId: 'household', categoryId: 'c-cleaning', title: 'Mop kitchen floor', notes: null, done: false, starred: false, priority: 'LOW', dueDate: nextWeekStr, assignedUserId: null, recurrenceRule: { intervalUnit: 'WEEKS', intervalValue: 2 }, parentItemId: null, sortOrder: 3, createdAt: lastMonthStr },
  // Household - Maintenance
  { id: 'i12', listId: 'household', categoryId: 'c-maintenance', title: 'Replace HVAC filter', notes: 'Use MERV-11 or higher', done: false, starred: true, priority: 'HIGH', dueDate: yesterdayStr, assignedUserId: null, recurrenceRule: { intervalUnit: 'MONTHS', intervalValue: 3 }, parentItemId: null, sortOrder: 1, createdAt: lastMonthStr },
  { id: 'i13', listId: 'household', categoryId: 'c-maintenance', title: 'Check smoke detectors', notes: null, done: false, starred: false, priority: 'URGENT', dueDate: nextWeekStr, assignedUserId: 'u1', recurrenceRule: { intervalUnit: 'MONTHS', intervalValue: 6 }, parentItemId: null, sortOrder: 2, createdAt: lastMonthStr },
  // Personal - Health
  { id: 'i14', listId: 'personal', categoryId: 'c-health', title: 'Schedule dentist appointment', notes: null, done: false, starred: false, priority: 'HIGH', dueDate: nextWeekStr, assignedUserId: null, recurrenceRule: { intervalUnit: 'MONTHS', intervalValue: 6 }, parentItemId: null, sortOrder: 1, createdAt: lastMonthStr },
  { id: 'i15', listId: 'personal', categoryId: 'c-health', title: 'Morning run', notes: 'At least 5km', done: true, starred: true, priority: 'NORMAL', dueDate: todayStr, assignedUserId: null, recurrenceRule: { intervalUnit: 'DAYS', intervalValue: 1 }, parentItemId: null, sortOrder: 2, createdAt: lastMonthStr },
  // Personal - Finance
  { id: 'i16', listId: 'personal', categoryId: 'c-finance', title: 'Review monthly budget', notes: null, done: false, starred: false, priority: 'NORMAL', dueDate: nextWeekStr, assignedUserId: null, recurrenceRule: { intervalUnit: 'MONTHS', intervalValue: 1 }, parentItemId: null, sortOrder: 1, createdAt: lastMonthStr },
  // Personal - uncategorized
  { id: 'i17', listId: 'personal', categoryId: null, title: 'Read book', notes: 'Currently reading: The Pragmatic Programmer', done: false, starred: false, priority: null, dueDate: null, assignedUserId: null, recurrenceRule: null, parentItemId: null, sortOrder: 1, createdAt: lastMonthStr }
];
