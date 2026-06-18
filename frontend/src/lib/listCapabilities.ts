import type { ListRole } from '$lib/api/lists';

export interface ListCapabilities {
	canEditItems: boolean;
	canManageCategories: boolean;
	canEditList: boolean;
	canManageMembers: boolean;
}

const capabilitiesByRole: Record<ListRole, ListCapabilities> = {
	OWNER: {
		canEditItems: true,
		canManageCategories: true,
		canEditList: true,
		canManageMembers: true,
	},
	EDITOR: {
		canEditItems: true,
		canManageCategories: true,
		canEditList: false,
		canManageMembers: false,
	},
	VIEWER: {
		canEditItems: false,
		canManageCategories: false,
		canEditList: false,
		canManageMembers: false,
	},
};

export function getListCapabilities(role: ListRole): ListCapabilities {
	return capabilitiesByRole[role];
}
