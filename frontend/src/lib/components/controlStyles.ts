export type ControlTypographyPresetName = 'default' | 'compact' | 'title';

export const controlTypographyPresets: Record<ControlTypographyPresetName, string> = {
	default: 'typography-control',
	compact: 'font-sans text-xs leading-4',
	title: 'font-sans text-xl leading-7'
};

export const controlValueTextClasses = `${controlTypographyPresets.default} text-value`;
export const controlPlaceholderTextClasses = 'typography-placeholder';

// Geometry is selected independently of typography.
export const controlGeometryPresets = {
 default: 'px-3 py-2',
 small: 'px-3 py-1.5',
 compact: 'px-2 py-1'
} as const;

export const controlTextRoles = {
 value: controlValueTextClasses,
 placeholder: controlPlaceholderTextClasses,
 label: 'typography-label',
 supporting: 'typography-supporting',
 error: 'typography-error',
 title: `${controlTypographyPresets.title} font-bold text-heading`
} as const;
