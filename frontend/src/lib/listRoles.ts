import type { ListRole } from './api/lists';

const ROLE_LABELS: Record<ListRole, string> = {
	OWNER: 'Owner',
	EDITOR: 'Editor',
	VIEWER: 'Viewer'
};

export function formatListRole(role: ListRole): string {
	return ROLE_LABELS[role];
}
