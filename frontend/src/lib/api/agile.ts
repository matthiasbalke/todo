import { authedFetch } from './authedClient';
import type { TodayItemDto } from './today';
export type AgileItemDto = TodayItemDto;
export const getAgileItems = (fetchFn: typeof fetch = fetch): Promise<AgileItemDto[]> => authedFetch('/api/agile', undefined, fetchFn);
export async function getAgileCount(fetchFn: typeof fetch = fetch): Promise<number> {
    return (await authedFetch<{ count: number }>('/api/agile/count', undefined, fetchFn)).count;
}
export const selectAgileItem = (id: string, selected: boolean): Promise<{ selected: boolean; count: number }> =>
    authedFetch(`/api/agile/items/${id}`, { method: 'PUT', body: JSON.stringify({ selected }) });
export const reorderAgile = (itemIds: string[]): Promise<void> =>
    authedFetch('/api/agile/order', { method: 'PUT', body: JSON.stringify({ itemIds }) });
