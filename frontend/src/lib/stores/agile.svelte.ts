import * as api from '$lib/api/agile';
import type { AgileItemDto } from '$lib/api/agile';
import { getCurrentUser } from './auth.svelte';
import { getProfile } from './preferences.svelte';
import { ApiError } from '$lib/api/client';

let owner = $state<string | null>(null);
let generation = 0;
let entries = $state<AgileItemDto[]>([]);
let count = $state(0);
let loading = $state(false);
let saving = $state(false);
let error = $state('');
let loaded = false;
let pending: Promise<void> | null = null;
let request = 0;

export function resetAgile(): void {
    generation++; request++;
    owner = null; entries = []; count = 0; loading = false; saving = false; error = ''; loaded = false; pending = null;
}
function scope(): string | null {
    const id = getCurrentUser()?.id ?? null;
    if (id !== owner) { resetAgile(); owner = id; }
    return id;
}
function enabled(): boolean { const id = scope(); return !!id && getProfile()?.id === id && !!getProfile()?.agileViewEnabled; }
function currentScope(): boolean { return owner !== null && owner === getCurrentUser()?.id; }
export function getAgileEntries(): AgileItemDto[] { return currentScope() ? entries : []; }
export function getAgileCount(): number { return currentScope() ? count : 0; }
export function isAgileSelected(id: string): boolean { return getAgileEntries().some(e => e.id === id); }
export function isAgileLoading(): boolean { return currentScope() && loading; }
export function isAgileSaving(): boolean { return currentScope() && saving; }
export function getAgileError(): string { return currentScope() ? error : ''; }

export async function loadAgile(force = false): Promise<void> {
    if (!enabled()) return;
    if (pending) return pending;
    if (loaded && !force) return;
    const id = owner, epoch = generation, version = ++request;
    loading = true;
    pending = (async () => {
        try {
            const result = await api.getAgileItems();
            if (id !== scope() || epoch !== generation || version !== request) return;
            entries = result; count = result.filter(e => !e.done).length; loaded = true; error = '';
        } catch (e) {
            if (id === scope() && epoch === generation) error = 'Could not load Agile. Please retry.';
            throw e;
        } finally {
            if (id === scope() && epoch === generation) { loading = false; pending = null; }
        }
    })();
    return pending;
}
export async function refreshAgile(): Promise<void> { await loadAgile(true); }
export async function setAgileSelection(id: string, selected: boolean): Promise<void> {
    if (!enabled() || saving) return;
    const account = owner, epoch = generation;
    saving = true; error = ''; request++;
    try {
        await api.selectAgileItem(id, selected);
        if (scope() !== account || epoch !== generation) return;
        loaded = false;
        if (pending) await pending;
        await loadAgile(true);
    } catch (e) {
        if (scope() === account && epoch === generation) error = 'Could not save Agile selection. Please retry.';
        throw e;
    } finally { if (scope() === account && epoch === generation) saving = false; }
}
export async function saveAgileOrder(ids: string[]): Promise<void> {
    if (!enabled() || saving) return;
    const account = owner, epoch = generation, confirmed = entries;
    const unfinished = new Map(entries.filter(e => !e.done).map(e => [e.id, e]));
    let index = 0;
    entries = entries.map(e => e.done ? e : unfinished.get(ids[index++]) ?? e);
    saving = true; error = ''; request++;
    try {
        await api.reorderAgile(ids);
        if (scope() === account && epoch === generation) {
            // A preceding navigation fetch was invalidated when this save started.
            if (pending) await pending.catch(() => {});
            await loadAgile(true).catch(() => {});
        }
    } catch (e) {
        if (scope() === account && epoch === generation) {
            entries = confirmed;
            if (e instanceof ApiError && e.status === 409) {
                if (pending) await pending.catch(() => {});
                await loadAgile(true).catch(() => {});
                error = 'Your backlog changed. Review the refreshed plan and retry.';
            } else error = 'Could not save order. Please retry.';
        }
        throw e;
    } finally { if (scope() === account && epoch === generation) saving = false; }
}
