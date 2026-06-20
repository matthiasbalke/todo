import type { ListRole } from '$lib/api/lists';

export interface ListCapabilities {
	canEditItems: boolean;
	canManageCategories: boolean;
	canEditList: boolean;
	canDuplicateList: boolean;
	canManageMembers: boolean;
}

const capabilitiesByRole: Record<ListRole, ListCapabilities> = {
	OWNER: {
		canEditItems: true,
		canManageCategories: true,
		canEditList: true,
		canDuplicateList: true,
		canManageMembers: true,
	},
	EDITOR: {
		canEditItems: true,
		canManageCategories: true,
		canEditList: false,
		canDuplicateList: false,
		canManageMembers: false,
	},
	VIEWER: {
		canEditItems: false,
		canManageCategories: false,
		canEditList: false,
		canDuplicateList: false,
		canManageMembers: false,
	},
};

export function getListCapabilities(role: ListRole): ListCapabilities {
	return capabilitiesByRole[role];
}
