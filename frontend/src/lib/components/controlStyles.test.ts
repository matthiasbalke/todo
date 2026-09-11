import { describe, expect, it } from 'vitest';
import {
	controlPlaceholderTextClasses,
	controlTypographyPresets,
	controlValueTextClasses
} from './controlStyles';

describe('controlStyles', () => {
	it('defines shared typography presets for built controls', () => {
		expect(controlTypographyPresets).toEqual({
			default: 'typography-control',
			compact: 'font-sans text-xs leading-4',
			title: 'font-sans text-xl leading-7'
		});
	});

	it('defines shared display text classes for built controls', () => {
		expect(controlValueTextClasses).toBe('typography-control text-value');
		expect(controlPlaceholderTextClasses).toBe('typography-placeholder');
	});
});
