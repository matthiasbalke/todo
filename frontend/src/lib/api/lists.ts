import { authedFetch } from './authedClient';

export type ListRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface ListSummaryDto {
	id: string;
	name: string;
	emoji: string | null;
	createdAt: string;
}

export interface ListDto {
	id: string;
	name: string;
	emoji: string | null;
	description: string | null;
	defaultSortField: string;
	defaultSortDirection: string;
	createdAt: string;
}

export interface MemberDto {
	userId: string;
	email: string;
	displayName: string;
	role: ListRole;
	createdAt: string;
}

export interface CreateListRequest {
	name: string;
	emoji?: string;
	description?: string;
	defaultSortField?: string;
	defaultSortDirection?: string;
}

export interface UpdateListRequest {
	name: string;
	emoji?: string;
	description?: string;
	defaultSortField?: string;
	defaultSortDirection?: string;
}

export interface AddMemberRequest {
	email: string;
	role: ListRole;
}

export interface ChangeMemberRoleRequest {
	role: ListRole;
}


export function getLists(fetchFn: typeof fetch = fetch): Promise<ListSummaryDto[]> {
	return authedFetch('/api/lists', undefined, fetchFn);
}

export function createList(req: CreateListRequest): Promise<ListDto> {
	return authedFetch('/api/lists', {
		method: 'POST',
		body: JSON.stringify(req),
	});
}

export function getList(id: string): Promise<ListDto> {
	return authedFetch(`/api/lists/${id}`);
}

export function updateList(id: string, req: UpdateListRequest): Promise<ListDto> {
	return authedFetch(`/api/lists/${id}`, {
		method: 'PUT',
		body: JSON.stringify(req),
	});
}

export function deleteList(id: string): Promise<void> {
	return authedFetch(`/api/lists/${id}`, { method: 'DELETE' });
}

export function getMembers(listId: string): Promise<MemberDto[]> {
	return authedFetch(`/api/lists/${listId}/members`);
}

export function addMember(listId: string, req: AddMemberRequest): Promise<MemberDto> {
	return authedFetch(`/api/lists/${listId}/members`, {
		method: 'POST',
		body: JSON.stringify(req),
	});
}

export function changeMemberRole(
	listId: string,
	userId: string,
	req: ChangeMemberRoleRequest,
): Promise<MemberDto> {
	return authedFetch(`/api/lists/${listId}/members/${userId}`, {
		method: 'PUT',
		body: JSON.stringify(req),
	});
}

export function removeMember(listId: string, userId: string): Promise<void> {
	return authedFetch(`/api/lists/${listId}/members/${userId}`, { method: 'DELETE' });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface CategoryDto {
	id: string;
	listId: string;
	name: string;
	color: string | null;
	sortOrder: number;
	createdAt: string;
}

export interface CreateCategoryRequest {
	name: string;
	color?: string | null;
	sortOrder: number;
}

export interface UpdateCategoryRequest {
	name: string;
	color?: string | null;
	sortOrder: number;
}

export function getCategories(listId: string): Promise<CategoryDto[]> {
	return authedFetch(`/api/lists/${listId}/categories`);
}

export function createCategory(listId: string, req: CreateCategoryRequest): Promise<CategoryDto> {
	return authedFetch(`/api/lists/${listId}/categories`, {
		method: 'POST',
		body: JSON.stringify(req),
	});
}

export function updateCategory(
	listId: string,
	categoryId: string,
	req: UpdateCategoryRequest,
): Promise<CategoryDto> {
	return authedFetch(`/api/lists/${listId}/categories/${categoryId}`, {
		method: 'PUT',
		body: JSON.stringify(req),
	});
}

export function deleteCategory(listId: string, categoryId: string): Promise<void> {
	return authedFetch(`/api/lists/${listId}/categories/${categoryId}`, { method: 'DELETE' });
}
