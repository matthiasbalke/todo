import { fetchJson } from './client';
import { getAccessToken } from '$lib/stores/auth.svelte';

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

function authedFetch<T>(url: string, init?: RequestInit): Promise<T> {
	const token = getAccessToken();
	return fetchJson<T>(url, {
		...init,
		headers: {
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...init?.headers,
		},
	});
}

export function getLists(): Promise<ListSummaryDto[]> {
	return authedFetch('/api/lists');
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
