export type ControlTypographyPresetName = 'default' | 'compact' | 'title';

export const controlTypographyPresets: Record<ControlTypographyPresetName, string> = {
	default: 'font-sans text-sm leading-5',
	compact: 'font-sans text-xs leading-4',
	title: 'font-sans text-xl leading-7'
};

export const controlValueTextClasses = `${controlTypographyPresets.default} text-gray-800`;
export const controlPlaceholderTextClasses = `${controlTypographyPresets.default} text-gray-500 italic`;
